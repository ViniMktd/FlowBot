import { Router } from 'express';
import { SupplierController } from '@/controllers/supplier.controller';
import { validateRequest } from '@/middleware/validation';
import { authentication } from '@/middleware/auth';
import {
  supplierSchema,
  updateSupplierSchema,
  performanceRatingSchema
} from '@/schemas';

const router = Router();
const supplierController = new SupplierController();

// Todas as rotas de fornecedores requerem autenticação
router.use(authentication);

// Rotas CRUD para fornecedores
router.post('/', validateRequest(supplierSchema), supplierController.createSupplier);
router.get('/', supplierController.listSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.get('/cnpj/:cnpj', supplierController.getSupplierByCNPJ);
router.put('/:id', validateRequest(updateSupplierSchema), supplierController.updateSupplier);

// Rotas de ações específicas
router.patch('/:id/toggle-status', supplierController.toggleSupplierStatus);
router.patch('/:id/performance-rating', validateRequest(performanceRatingSchema), supplierController.updatePerformanceRating);
router.get('/:id/stats', supplierController.getSupplierStats);

export default router;
