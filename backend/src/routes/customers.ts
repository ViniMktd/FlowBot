import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authentication } from '../middleware/auth';

const router = Router();
const customerController = new CustomerController();

/**
 * Rotas para gerenciamento de clientes
 */

// CRUD básico
router.post('/',
  authentication,
  customerController.createCustomer.bind(customerController)
);

router.get('/',
  authentication,
  customerController.getCustomers.bind(customerController)
);

router.get('/:id',
  authentication,
  customerController.getCustomerById.bind(customerController)
);

router.put('/:id',
  authentication,
  customerController.updateCustomer.bind(customerController)
);

router.delete('/:id',
  authentication,
  customerController.deleteCustomer.bind(customerController)
);

export default router;
