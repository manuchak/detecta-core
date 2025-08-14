import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Component for managing environment variables and API keys securely
 */
export const EnvironmentConfig: React.FC = () => {
  const [showTokens, setShowTokens] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const currentMapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      toast({
        title: "Copied!",
        description: `${keyName} copied to clipboard`
      });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const environmentVariables = [
    {
      name: 'VITE_MAPBOX_ACCESS_TOKEN',
      value: currentMapboxToken,
      description: 'Mapbox public access token for map functionality',
      required: true,
      isPublic: true
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Environment Configuration
          </CardTitle>
          <CardDescription>
            Manage API keys and environment variables securely. All sensitive keys should be set as environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> API keys and tokens have been moved to environment variables for better security. 
              Set these values in your deployment environment or local .env file.
            </AlertDescription>
          </Alert>

          {/* Environment Variables List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Environment Variables</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTokens(!showTokens)}
              >
                {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showTokens ? 'Hide' : 'Show'} Values
              </Button>
            </div>

            {environmentVariables.map((envVar) => (
              <div key={envVar.name} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{envVar.name}</Label>
                    <p className="text-xs text-muted-foreground">{envVar.description}</p>
                    <div className="flex gap-2">
                      {envVar.required && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                      {envVar.isPublic && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(envVar.name, envVar.name)}
                    className="shrink-0"
                  >
                    {copiedKey === envVar.name ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type={showTokens ? 'text' : 'password'}
                    value={envVar.value || 'Not set'}
                    readOnly
                    className={`font-mono text-sm ${!envVar.value ? 'text-muted-foreground' : ''}`}
                  />
                  {envVar.value && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(envVar.value, 'Token value')}
                    >
                      {copiedKey === 'Token value' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {!envVar.value && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      This environment variable is not set. Add it to your .env file or deployment configuration.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>

          {/* Setup Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Setup Instructions</h3>
            <div className="space-y-2 text-sm">
              <p><strong>For local development:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Create a <code className="px-1 py-0.5 bg-muted rounded">.env</code> file in your project root</li>
                <li>Add your environment variables:</li>
              </ol>
              <pre className="bg-muted p-3 rounded-md text-xs">
                VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
              </pre>
              <p><strong>For production:</strong></p>
              <p>Set these environment variables in your deployment platform (Vercel, Netlify, etc.)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentConfig;