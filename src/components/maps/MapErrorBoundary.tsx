import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detailed error for debugging
    console.error("[MapErrorBoundary] Caught error:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      googleAvailable: typeof window !== "undefined" && !!window.google,
      googleMapsAvailable: typeof window !== "undefined" && !!window.google?.maps,
    });
    
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      
      return (
        <div className="h-full flex flex-col items-center justify-center bg-muted p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="font-semibold text-lg mb-2">
            Oops! Qualcosa è andato storto
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {this.props.fallbackMessage || 
              "Si è verificato un errore durante il caricamento della mappa. Riprova o torna alla lista."}
          </p>
          
          {isDev && this.state.error && (
            <div className="w-full max-w-md mb-4 p-3 bg-destructive/10 rounded-lg text-left overflow-auto max-h-32">
              <p className="text-xs font-mono text-destructive break-all">
                {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <pre className="text-xs font-mono text-muted-foreground mt-2 whitespace-pre-wrap break-all">
                  {this.state.error.stack.split("\n").slice(0, 5).join("\n")}
                </pre>
              )}
            </div>
          )}
          
          <Button variant="outline" onClick={this.handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Riprova
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
