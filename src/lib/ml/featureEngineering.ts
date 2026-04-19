import { Dataset,EncodingMaps,ScalerParams } from '@/types';


export function prepareDataset(
  data: Record<string, string>[],
  columns: string[],
  targetColumn: string,
  providedEncodingMaps?: EncodingMaps,
  providedScalerParams?: ScalerParams
): { dataset: Dataset; encodingMaps: EncodingMaps; scalerParams: ScalerParams } {
  const encodingMaps: EncodingMaps = providedEncodingMaps ?? {};
  const scalerParams: ScalerParams = providedScalerParams ?? { mins: [], maxs: [] };
  const featureIndices: string[] = columns.filter((c) => c !== targetColumn);

  // Filter out rows with empty target values
  const filteredData = data.filter((row) => {
    const target = row[targetColumn]?.trim();
    return target !== '' && target !== undefined && target !== null;
  });

  if (filteredData.length === 0) {
    return {
      dataset: { features: [], labels: [], featureNames: featureIndices },
      encodingMaps,
      scalerParams,
    };
  }

  const columnTypes: { [key: string]: 'numeric' | 'categorical' } = {};

  for (const col of columns) {
    const values = filteredData.map((row) => row[col]?.trim() ?? '');
    const nonEmpty = values.filter((v) => v !== '');
    const numericPattern = /^-?\d+\.?\d*$/;
    const allNumeric = nonEmpty.length > 0 && nonEmpty.every((v) => numericPattern.test(v));
    columnTypes[col] = allNumeric ? 'numeric' : 'categorical';
  }

  // Encode features
  const features: number[][] = [];

  for (const row of filteredData) {
    const featureRow: number[] = [];

    for (const col of featureIndices) {
      const value = row[col]?.trim() ?? '';

      if (columnTypes[col] === 'numeric') {
        const num = parseFloat(value);
        featureRow.push(isNaN(num) ? 0 : num);
      } else {
        if (!encodingMaps[col]) {
          encodingMaps[col] = {};
        }
        if (!(value in encodingMaps[col])) {
          encodingMaps[col][value] = Object.keys(encodingMaps[col]).length;
        }
        featureRow.push(encodingMaps[col][value]);
      }
    }

    features.push(featureRow);
  }

  // Prepare labels (binary: 0 or 1)
  const targetValues = filteredData.map((row) => row[targetColumn]?.trim() ?? '');

  // Determine unique values for target
  const uniqueTargets = [...new Set(targetValues)];

  // If target is numeric, use median split
  let labels: number[];

  if (uniqueTargets.length === 2) {
    // Binary classification (Yes/No, True/False, 0/1)
    labels = targetValues.map((v) => (v.toLowerCase() === 'yes' || v === '1' || v.toLowerCase() === 'true' ? 1 : 0));
  } else {
    // Use median split for continuous targets
    const numericValues = targetValues.map((v) => {
      const num = parseFloat(v);
      return isNaN(num) ? 0 : num;
    });
    const median = getMedian(numericValues);
    labels = numericValues.map((v) => (v > median ? 1 : 0));
  }

  // Normalize using provided or computed scaler params
  const normalizedFeatures = normalizeFeatures(features, scalerParams);

  return {
    dataset: {
      features: normalizedFeatures,
      labels,
      featureNames: featureIndices,
    },
    encodingMaps,
    scalerParams,
  };
}

function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function normalizeFeatures(features: number[][], scalerParams: ScalerParams): number[][] {
  if (features.length === 0) return features;

  const numFeatures = features[0].length;

  // If scalerParams not provided, compute from data
  if (scalerParams.mins.length === 0 || scalerParams.maxs.length === 0) {
    scalerParams.mins = new Array(numFeatures).fill(Infinity);
    scalerParams.maxs = new Array(numFeatures).fill(-Infinity);

    for (const row of features) {
      for (let i = 0; i < numFeatures; i++) {
        scalerParams.mins[i] = Math.min(scalerParams.mins[i], row[i]);
        scalerParams.maxs[i] = Math.max(scalerParams.maxs[i], row[i]);
      }
    }
  }

  // Normalize to [0, 1] using pre-computed mins/maxs
  return features.map((row) =>
    row.map((val, i) => {
      const range = scalerParams.maxs[i] - scalerParams.mins[i];
      return range === 0 ? 0 : (val - scalerParams.mins[i]) / range;
    })
  );
}

export function trainTestSplit(
  dataset: Dataset,
  testRatio = 0.2
): { train: Dataset; test: Dataset } {
  const indices = [...Array(dataset.features.length).keys()];
  shuffleArray(indices);

  const splitIndex = Math.floor(dataset.features.length * (1 - testRatio));

  const trainIndices = indices.slice(0, splitIndex);
  const testIndices = indices.slice(splitIndex);

  return {
    train: {
      features: trainIndices.map((i) => dataset.features[i]),
      labels: trainIndices.map((i) => dataset.labels[i]),
      featureNames: dataset.featureNames,
    },
    test: {
      features: testIndices.map((i) => dataset.features[i]),
      labels: testIndices.map((i) => dataset.labels[i]),
      featureNames: dataset.featureNames,
    },
  };
}

function shuffleArray(array: number[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
