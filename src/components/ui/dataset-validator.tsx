'use client';

import { AlertTriangleIcon, UploadIcon, ArrowRightIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatasetValidationResult } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DatasetValidatorProps {
  validation: DatasetValidationResult;
  onReset?: () => void;
}

export function DatasetValidator({ validation, onReset }: DatasetValidatorProps) {
  if (validation.isValid) {
    return null;
  }

  return (
    <Card className="border-destructive mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangleIcon className="size-5" />
          Dataset Not Suitable for Customer Analytics
        </CardTitle>
        <CardDescription>
          This dataset does not appear to represent customer behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium">Why it failed:</p>
          <ul className="space-y-2">
            {validation.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-destructive mt-0.5">•</span>
                <span className="text-muted-foreground">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">How to fix:</p>
          <ul className="space-y-2">
            {validation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span className="text-muted-foreground">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs">
            Signal Score: {validation.score}/4
          </Badge>
          <div className="flex gap-1">
            {validation.signals.hasCustomerId && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Customer ID</Badge>
            )}
            {validation.signals.hasTarget && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Target</Badge>
            )}
            {validation.signals.hasBehavior && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Behavior</Badge>
            )}
            {validation.signals.hasTime && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">Time</Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onReset}>
            <UploadIcon className="size-4 mr-2" />
            Upload Different Dataset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}