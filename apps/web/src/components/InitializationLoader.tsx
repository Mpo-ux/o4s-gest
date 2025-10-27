/**
 * InitializationLoader - Componente de Loading da Inicialização
 *
 * Componente React que mostra o progresso de inicialização da aplicação
 * com animações elegantes e informações detalhadas.
 */

import React, { useState, useEffect } from "react";
import styles from "./InitializationLoader.module.css";
import AppInitializer, {
  InitializationProgress,
  InitializationResult,
} from "../utils/appInitializer";

interface InitializationLoaderProps {
  onComplete: (result: InitializationResult) => void;
  showDetails?: boolean;
  enableSkip?: boolean;
}

const InitializationLoader: React.FC<InitializationLoaderProps> = ({
  onComplete,
  showDetails = false,
  enableSkip = false,
}) => {
  const [progress, setProgress] = useState<InitializationProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const appInitializer = AppInitializer.getInstance();

    const initializeApp = async () => {
      try {
        const result = await appInitializer.initialize({
          progressCallback: (progressData) => {
            setProgress(progressData);
          },
          developmentMode: process.env.NODE_ENV === "development",
        });

        setIsComplete(true);

        // Aguardar um pouco para mostrar 100% antes de chamar onComplete
        setTimeout(() => {
          onComplete(result);
        }, 1000);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Initialization failed"
        );
        console.error("Initialization error:", error);
      }
    };

    if (!skipped) {
      initializeApp();
    }
  }, [onComplete, skipped]);

  const handleSkip = () => {
    setSkipped(true);
    // Simular resultado de inicialização básica
    const basicResult: InitializationResult = {
      success: true,
      duration: 0,
      errors: [],
      warnings: ["Initialization skipped"],
      configuration: null,
      cacheMetrics: null,
      preloadResults: null,
    };
    onComplete(basicResult);
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case "cache":
        return "💾";
      case "config":
        return "⚙️";
      case "connection":
        return "🌐";
      case "auth":
        return "🔐";
      case "preload":
        return "🚀";
      case "complete":
        return "✅";
      default:
        return "⚡";
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "cache":
        return "text-blue-600";
      case "config":
        return "text-purple-600";
      case "connection":
        return "text-green-600";
      case "auth":
        return "text-yellow-600";
      case "preload":
        return "text-orange-600";
      case "complete":
        return "text-emerald-600";
      default:
        return "text-gray-600";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Initialization Failed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse">
            {progress ? getPhaseIcon(progress.phase) : "🚀"}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            O4S gest
          </h1>
          <p className="text-gray-600">
            {isComplete ? "Initialization Complete!" : "Starting up..."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {progress?.step || "Preparing..."}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress?.percentage || 0)}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={
                "h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out" +
                " " +
                (progress ? `w-[${Math.round(progress.percentage)}%]` : "w-0")
              }
              aria-label="Initialization progress"
              aria-valuenow={
                typeof progress?.percentage === "number"
                  ? Math.round(progress.percentage)
                  : 0
              }
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            >
              <div className="h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Current Phase */}
        {progress && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getPhaseIcon(progress.phase)}</span>
              <div>
                <div
                  className={`font-semibold capitalize ${getPhaseColor(
                    progress.phase
                  )}`}
                >
                  {progress.phase} Phase
                </div>
                <div className="text-sm text-gray-600">{progress.step}</div>
              </div>
            </div>
          </div>
        )}

        {/* Details Panel */}
        {showDetails && progress && (
          <div className="mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Elapsed Time:</span>
              <span className="font-medium">
                {Math.round(progress.elapsed)}ms
              </span>
            </div>

            {progress.estimated > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Total:</span>
                <span className="font-medium">
                  {Math.round(progress.estimated)}ms
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phase:</span>
              <span
                className={`font-medium capitalize ${getPhaseColor(
                  progress.phase
                )}`}
              >
                {progress.phase}
              </span>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={
                  styles.bounceDot +
                  " " +
                  (i === 0
                    ? styles.delay0
                    : i === 1
                    ? styles.delay1
                    : styles.delay2)
                }
                aria-hidden="true"
              ></div>
            ))}
          </div>
        </div>

        {/* Skip Button */}
        {enableSkip && !isComplete && (
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
            >
              Skip initialization
            </button>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className="text-center animate-fade-in">
            <div className="text-green-600 font-semibold mb-2">
              ✅ Ready to go!
            </div>
            <div className="text-sm text-gray-600">Loading application...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitializationLoader;
