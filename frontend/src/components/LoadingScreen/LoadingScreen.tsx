import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Avatar,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import { keyframes } from '@mui/system';

// Animação de pulso para o logo
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Animação de rotação suave
const rotateAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  variant?: 'default' | 'minimal' | 'splash';
  size?: 'small' | 'medium' | 'large';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Carregando...',
  progress,
  variant = 'default',
  size = 'medium',
}) => {
  const theme = useTheme();

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { logoSize: 40, progressSize: 32, spacing: 2 };
      case 'large':
        return { logoSize: 80, progressSize: 48, spacing: 4 };
      default:
        return { logoSize: 60, progressSize: 40, spacing: 3 };
    }
  };

  const { logoSize, progressSize, spacing } = getSizeConfig();

  // Versão minimal para usar em componentes menores
  if (variant === 'minimal') {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={2}
        p={2}
      >
        <CircularProgress size={progressSize} />
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  // Versão splash para carregamento inicial
  if (variant === 'splash') {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 9999,
        }}
      >
        <Fade in timeout={500}>
          <Box textAlign="center">
            {/* Logo animado */}
            <Avatar
              sx={{
                width: logoSize,
                height: logoSize,
                bgcolor: 'primary.main',
                mx: 'auto',
                mb: spacing,
                fontSize: `${logoSize * 0.6}px`,
                animation: `${pulseAnimation} 2s ease-in-out infinite`,
              }}
            >
              🤖
            </Avatar>

            {/* Nome do sistema */}
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              FlowBot
            </Typography>

            <Typography
              variant="subtitle1"
              color="text.secondary"
              gutterBottom
            >
              Sistema de Fulfillment Internacional
            </Typography>

            {/* Progress indicator */}
            <Box sx={{ mt: 4, mb: 2, minWidth: 200 }}>
              {progress !== undefined ? (
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              ) : (
                <LinearProgress
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
              )}
            </Box>

            {/* Message */}
            <Typography variant="body2" color="text.secondary">
              {message}
              {progress !== undefined && ` (${Math.round(progress)}%)`}
            </Typography>

            {/* Indicadores de funcionalidades */}
            <Box sx={{ mt: 4, display: 'flex', gap: 4, justifyContent: 'center' }}>
              <Box textAlign="center">
                <Typography variant="body2" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                  🌍
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Internacional
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                  🇨🇳
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fornecedores Chineses
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                  💬
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  WhatsApp Multilíngue
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Box>
    );
  }

  // Versão padrão
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: spacing,
      }}
    >
      <Fade in timeout={300}>
        <Box textAlign="center">
          {/* Logo com animação */}
          <Box
            sx={{
              position: 'relative',
              mb: spacing,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Avatar
              sx={{
                width: logoSize,
                height: logoSize,
                bgcolor: 'primary.main',
                fontSize: `${logoSize * 0.6}px`,
                animation: `${pulseAnimation} 2s ease-in-out infinite`,
              }}
            >
              🤖
            </Avatar>
            
            {/* Círculo de loading ao redor do logo */}
            <CircularProgress
              size={logoSize + 16}
              thickness={2}
              sx={{
                position: 'absolute',
                color: alpha(theme.palette.primary.main, 0.3),
                animation: `${rotateAnimation} 2s linear infinite`,
              }}
            />
          </Box>

          {/* Mensagem principal */}
          <Typography
            variant={size === 'large' ? 'h6' : 'subtitle1'}
            fontWeight="medium"
            gutterBottom
            color="text.primary"
          >
            {message}
          </Typography>

          {/* Progress bar se fornecido */}
          {progress !== undefined && (
            <Box sx={{ mt: 2, minWidth: 200 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                {Math.round(progress)}% concluído
              </Typography>
            </Box>
          )}

          {/* Indicador de pontos animados */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                '&::after': {
                  content: '"..."',
                  animation: 'dots 1.5s steps(5, end) infinite',
                  '@keyframes dots': {
                    '0%, 20%': { color: 'transparent' },
                    '40%': { color: theme.palette.text.secondary },
                    '60%': { color: 'transparent' },
                    '80%, 100%': { color: theme.palette.text.secondary },
                  },
                },
              }}
            >
              Aguarde
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

// Componente para loading de tela cheia com overlay
export const LoadingOverlay: React.FC<LoadingScreenProps> = (props) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha('#fff', 0.8),
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
      }}
    >
      <LoadingScreen {...props} />
    </Box>
  );
};

// Hook personalizado para estados de loading
export const useLoading = () => {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('Carregando...');
  const [progress, setProgress] = React.useState<number | undefined>(undefined);

  const startLoading = (msg?: string) => {
    setMessage(msg || 'Carregando...');
    setLoading(true);
  };

  const stopLoading = () => {
    setLoading(false);
    setProgress(undefined);
  };

  const updateProgress = (value: number, msg?: string) => {
    setProgress(value);
    if (msg) setMessage(msg);
  };

  return {
    loading,
    message,
    progress,
    startLoading,
    stopLoading,
    updateProgress,
  };
};

export default LoadingScreen;