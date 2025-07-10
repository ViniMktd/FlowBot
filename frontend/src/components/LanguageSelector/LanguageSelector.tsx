import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, getAvailableLanguages } from '../../i18n/index';

interface LanguageSelectorProps {
  variant?: 'button' | 'chip' | 'minimal';
  showFlag?: boolean;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'button',
  showFlag = true,
  showText = true,
  size = 'medium'
}) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  
  const availableLanguages = getAvailableLanguages();
  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    handleClose();
  };

  const renderTrigger = () => {
    const commonProps = {
      onClick: handleClick,
      'aria-controls': anchorEl ? 'language-menu' : undefined,
      'aria-haspopup': 'true',
      'aria-expanded': anchorEl ? 'true' : undefined,
    };

    switch (variant) {
      case 'chip':
        return (
          <Chip
            {...commonProps}
            icon={showFlag ? undefined : <LanguageIcon />}
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                {showFlag && <span>{currentLang?.flag}</span>}
                {showText && <span>{currentLang?.name}</span>}
              </Box>
            }
            variant="outlined"
            size={size}
            clickable
          />
        );
      
      case 'minimal':
        return (
          <Button
            {...commonProps}
            variant="text"
            size={size}
            sx={{ 
              minWidth: 'auto',
              p: 1,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            {showFlag ? currentLang?.flag : <PublicIcon />}
          </Button>
        );
      
      default:
        return (
          <Button
            {...commonProps}
            variant="outlined"
            startIcon={showFlag ? undefined : <LanguageIcon />}
            size={size}
            sx={{
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              }
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {showFlag && <span>{currentLang?.flag}</span>}
              {showText && (
                <Typography variant="body2" component="span">
                  {currentLang?.name}
                </Typography>
              )}
            </Box>
          </Button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
            },
          },
        }}
      >
        <Box px={2} py={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('settings.language')}
          </Typography>
        </Box>
        
        <Divider />
        
        {availableLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === currentLanguage}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.50',
                '&:hover': {
                  backgroundColor: 'primary.100',
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {language.code === currentLanguage ? (
                <CheckIcon color="primary" fontSize="small" />
              ) : (
                <span style={{ fontSize: '16px' }}>{language.flag}</span>
              )}
            </ListItemIcon>
            
            <ListItemText>
              <Box display="flex" alignItems="center" gap={1}>
                {language.code !== currentLanguage && (
                  <span>{language.flag}</span>
                )}
                <Typography variant="body2">
                  {language.name}
                </Typography>
                {language.code === currentLanguage && (
                  <Chip
                    label={t('common.current')}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            </ListItemText>
          </MenuItem>
        ))}
        
        <Divider />
        
        <Box px={2} py={1}>
          <Typography variant="caption" color="text.secondary">
            {t('settings.languageDescription', { 
              defaultValue: 'Select your preferred language for the interface'
            })}
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default LanguageSelector;