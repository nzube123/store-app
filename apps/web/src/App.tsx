import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './layouts/StoreLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { AccountPage, CartPage, CheckoutPage, HomePage, LoginPage, NotFoundPage, OrderDetailsPage, OrdersPage, PaymentReturnPage, ProductDetailsPage, ProductsPage } from './pages';
import { CartProvider } from './stores/CartStore';
import { ToastProvider } from './components/Toast';

export function App() {
  return <CartProvider><ToastProvider><BrowserRouter><Routes>
    <Route element={<StoreLayout />}>
      <Route index element={<HomePage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/:slug" element={<ProductDetailsPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
        <Route path="payment/return" element={<PaymentReturnPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></BrowserRouter></ToastProvider></CartProvider>;
}
