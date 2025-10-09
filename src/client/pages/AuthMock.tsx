import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/client/components/ui/card.js';
import { Button } from '@/client/components/ui/button.js';
import { KeyRound, AlertCircle, CheckCircle2, User } from 'lucide-react';

interface AuthParams {
  client_id: string;
  response_type: string;
  scope: string;
  redirect_uri: string;
  state?: string;
  nonce?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  userId?: string;
}

interface StoredResponse {
  id: string;
  responses: Record<string, string>;
  uniqueKeys: Record<string, string>;
  timestamp: string;
  createdAt: string;
}

const AuthMock: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [authParams, setAuthParams] = useState<AuthParams | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params: AuthParams = {
      client_id: searchParams.get('client_id') || '',
      response_type: searchParams.get('response_type') || '',
      scope: searchParams.get('scope') || '',
      redirect_uri: searchParams.get('redirect_uri') || '',
      state: searchParams.get('state') || undefined,
      nonce: searchParams.get('nonce') || undefined,
      code_challenge: searchParams.get('code_challenge') || undefined,
      code_challenge_method: searchParams.get('code_challenge_method') || undefined,
      userId: searchParams.get('userId') || searchParams.get('user_id') || undefined,
    };

    if (!params.client_id || !params.response_type || !params.redirect_uri) {
      navigate('/error?message=Missing required OAuth parameters');
      return;
    }

    setAuthParams(params);

    if (params.userId) {
      setUserId(params.userId);
      processAuth(params, params.userId);
    }
  }, [searchParams, navigate]);

  const processAuth = async (params: AuthParams, userIdValue: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/responses/${userIdValue}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setErrorMessage('No responses found for this userId. Please generate responses first.');
        } else {
          setErrorMessage('Failed to fetch responses for this userId');
        }
        setIsLoading(false);
        return;
      }

      const data: StoredResponse[] = await response.json();
      
      const authResponses = data.filter((r: StoredResponse) => 
        r.responses && 'okta' in r.responses
      );

      if (authResponses.length === 0) {
        setErrorMessage('No auth responses found for this userId');
        setIsLoading(false);
        return;
      }

      const selectedResponse = authResponses[0];
      const authResponseType = selectedResponse.responses.okta;

      const redirectUrl = new URL(params.redirect_uri);
      
      if (authResponseType === 'auth_success') {
        const authCode = `mock_code_${userIdValue}_${Date.now()}`;
        redirectUrl.searchParams.append('code', authCode);
      } else if (authResponseType === 'auth_error_user_not_assigned') {
        redirectUrl.searchParams.append('error', 'access_denied');
        redirectUrl.searchParams.append('error_description', 'User is not assigned to the client application');
      } else {
        redirectUrl.searchParams.append('error', 'access_denied');
        redirectUrl.searchParams.append('error_description', 'Authentication failed');
      }
      
      if (params.state) {
        redirectUrl.searchParams.append('state', params.state);
      }

      window.location.href = redirectUrl.toString();
    } catch (error) {
      console.error('Error processing authentication:', error);
      setErrorMessage('Failed to process authentication');
      setIsLoading(false);
    }
  };

  const handleUserIdSubmit = async () => {
    if (!userId.trim()) {
      setErrorMessage('Please enter a userId');
      return;
    }

    if (!authParams) return;

    await processAuth(authParams, userId.trim());
  };

  if (!authParams) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-primary rounded-xl">
              <KeyRound className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-center">Mock OAuth Authentication</CardTitle>
            </div>
          </div>
          <CardDescription className="text-center text-base">
            Enter your userId to authenticate with pre-configured mock responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold mb-3 flex items-center space-x-2 text-foreground">
              <span className="p-1.5 bg-blue-500 rounded-md">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span>OAuth Request Parameters</span>
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-foreground min-w-[120px]">Client ID:</span>
                <code className="flex-1 bg-background/60 px-2 py-0.5 rounded text-xs font-mono">{authParams.client_id}</code>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-foreground min-w-[120px]">Response Type:</span>
                <code className="flex-1 bg-background/60 px-2 py-0.5 rounded text-xs font-mono">{authParams.response_type}</code>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-foreground min-w-[120px]">Scope:</span>
                <code className="flex-1 bg-background/60 px-2 py-0.5 rounded text-xs font-mono break-all">{authParams.scope}</code>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-semibold text-foreground min-w-[120px]">Redirect URI:</span>
                <code className="flex-1 bg-background/60 px-2 py-0.5 rounded text-xs font-mono break-all">{authParams.redirect_uri}</code>
              </div>
              {authParams.state && (
                <div className="flex items-start space-x-2">
                  <span className="font-semibold text-foreground min-w-[120px]">State:</span>
                  <code className="flex-1 bg-background/60 px-2 py-0.5 rounded text-xs font-mono break-all">{authParams.state}</code>
                </div>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 text-primary" />
                <span>Enter User ID (Unique Key)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g., 1000"
                  className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-background text-foreground placeholder:text-muted-foreground"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUserIdSubmit();
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-start space-x-1">
                <svg className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Enter the userId that was used to generate mock responses</span>
              </p>
            </div>

            <Button
              onClick={handleUserIdSubmit}
              disabled={isLoading || !userId.trim()}
              className="w-full h-11 font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Continue
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-start space-x-2 text-xs text-muted-foreground">
              <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                This is a mock authentication page for testing OAuth flows. 
                The system will automatically use the first available auth response for your userId.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthMock;
