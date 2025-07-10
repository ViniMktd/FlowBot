import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  LocalShipping,
  TrackChanges,
  Schedule,
  Send,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface DispatchOrderDialogProps {
  open: boolean;
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalValue: number;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

interface DispatchFormData {
  trackingCode: string;
  carrier: string;
  estimatedDelivery: string;
  notes: string;
}

// Transportadoras disponíveis
const CARRIERS = [
  { value: 'Correios', label: 'Correios', icon: '📮' },
  { value: 'China Post', label: 'China Post', icon: '🇨🇳' },
  { value: 'DHL', label: 'DHL Express', icon: '🚀' },
  { value: 'FedEx', label: 'FedEx', icon: '📦' },
  { value: 'UPS', label: 'UPS', icon: '🚚' },
  { value: 'SEDEX', label: 'SEDEX', icon: '⚡' },
  { value: 'PAC', label: 'PAC', icon: '📬' },
];

const DispatchOrderDialog: React.FC<DispatchOrderDialogProps> = ({
  open,
  orderId,
  orderNumber,
  customerName,
  totalValue,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Validation schema
  const validationSchema = Yup.object({
    trackingCode: Yup.string()
      .required('Código de rastreamento é obrigatório')
      .min(8, 'Código deve ter pelo menos 8 caracteres')
      .max(50, 'Código muito longo'),
    carrier: Yup.string()
      .required('Transportadora é obrigatória'),
    estimatedDelivery: Yup.date()
      .min(new Date(), 'Data deve ser futura')
      .nullable(),
    notes: Yup.string()
      .max(500, 'Máximo 500 caracteres'),
  });

  // Form handling
  const formik = useFormik<DispatchFormData>({
    initialValues: {
      trackingCode: '',
      carrier: '',
      estimatedDelivery: '',
      notes: '',
    },
    validationSchema,
    onSubmit: (values) => {
      dispatchMutation.mutate(values);
    },
  });

  // API call for dispatching order
  const dispatchMutation = useMutation(
    async (data: DispatchFormData) => {
      const response = await fetch(`/api/shipping/order/${orderId}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao despachar pedido');
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        toast.success('✅ Pedido despachado com sucesso! Cliente será notificado automaticamente.');
        
        // Update cache
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['order', orderId]);
        queryClient.invalidateQueries(['dashboard']);

        // Call success callback
        onSuccess?.(data);

        // Close dialog
        handleClose();
      },
      onError: (error: Error) => {
        toast.error(`❌ Erro ao despachar: ${error.message}`);
      },
    }
  );

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const getCarrierIcon = (carrier: string) => {
    const carrierData = CARRIERS.find(c => c.value === carrier);
    return carrierData?.icon || '📦';
  };

  const getTrackingCodePattern = (carrier: string) => {
    const patterns: Record<string, string> = {
      'Correios': 'BR123456789',
      'China Post': 'CP123456789CN',
      'DHL': '1234567890',
      'FedEx': '1234.5678.9012',
      'UPS': '1Z999AA1234567890',
      'SEDEX': 'BR123456789',
      'PAC': 'BR123456789',
    };
    return patterns[carrier] || 'ABC123456789';
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalShipping sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h6">
              📦 Despachar Pedido
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {orderNumber} • {customerName} • R$ {totalValue.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                🚀 <strong>Automação Completa:</strong><br />
                • Shopify será atualizado automaticamente<br />
                • Cliente receberá email do Shopify + WhatsApp nosso<br />
                • Rastreamento será monitorado automaticamente
              </Typography>
            </Alert>

            {/* Transportadora */}
            <FormControl fullWidth>
              <InputLabel>Transportadora *</InputLabel>
              <Select
                name="carrier"
                value={formik.values.carrier}
                label="Transportadora *"
                onChange={formik.handleChange}
                error={formik.touched.carrier && Boolean(formik.errors.carrier)}
              >
                {CARRIERS.map((carrier) => (
                  <MenuItem key={carrier.value} value={carrier.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{carrier.icon}</span>
                      {carrier.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.carrier && formik.errors.carrier && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {formik.errors.carrier}
                </Typography>
              )}
            </FormControl>

            {/* Código de Rastreamento */}
            <TextField
              fullWidth
              name="trackingCode"
              label="Código de Rastreamento"
              placeholder={formik.values.carrier ? getTrackingCodePattern(formik.values.carrier) : 'Exemplo: BR123456789'}
              value={formik.values.trackingCode}
              onChange={formik.handleChange}
              error={formik.touched.trackingCode && Boolean(formik.errors.trackingCode)}
              helperText={
                formik.touched.trackingCode && formik.errors.trackingCode
                  ? formik.errors.trackingCode
                  : formik.values.carrier 
                  ? `Formato esperado: ${getTrackingCodePattern(formik.values.carrier)}`
                  : 'Digite o código fornecido pela transportadora'
              }
              InputProps={{
                startAdornment: (
                  <TrackChanges sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
            />

            {/* Previsão de Entrega */}
            <TextField
              fullWidth
              name="estimatedDelivery"
              label="Previsão de Entrega (Opcional)"
              type="date"
              value={formik.values.estimatedDelivery}
              onChange={formik.handleChange}
              error={formik.touched.estimatedDelivery && Boolean(formik.errors.estimatedDelivery)}
              helperText={
                formik.touched.estimatedDelivery && formik.errors.estimatedDelivery
                  ? formik.errors.estimatedDelivery
                  : 'Data estimada para entrega ao cliente'
              }
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <Schedule sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
              inputProps={{
                min: new Date().toISOString().split('T')[0],
              }}
            />

            {/* Observações */}
            <TextField
              fullWidth
              name="notes"
              label="Observações (Opcional)"
              placeholder="Ex: Entrega expressa, cuidado frágil, etc."
              multiline
              rows={3}
              value={formik.values.notes}
              onChange={formik.handleChange}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
              helperText={
                formik.touched.notes && formik.errors.notes
                  ? formik.errors.notes
                  : `${formik.values.notes.length}/500 caracteres`
              }
            />

            {/* Preview */}
            {formik.values.carrier && formik.values.trackingCode && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  📋 Resumo do Despacho:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<span>{getCarrierIcon(formik.values.carrier)}</span>}
                    label={formik.values.carrier}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<TrackChanges />}
                    label={formik.values.trackingCode}
                    color="secondary"
                    variant="outlined"
                  />
                  {formik.values.estimatedDelivery && (
                    <Chip
                      icon={<Schedule />}
                      label={new Date(formik.values.estimatedDelivery).toLocaleDateString('pt-BR')}
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={dispatchMutation.isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formik.isValid || !formik.dirty || dispatchMutation.isLoading}
            startIcon={
              dispatchMutation.isLoading ? (
                <CircularProgress size={18} />
              ) : (
                <Send />
              )
            }
            sx={{ minWidth: 140 }}
          >
            {dispatchMutation.isLoading ? 'Despachando...' : 'Despachar Pedido'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DispatchOrderDialog;