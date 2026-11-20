import { Link, Route, Routes } from "react-router";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Products from "./pages/Products";

export default function App() {
  return (
    <>
      <header className="top">
        <Link to="/" className="brand" data-testid="nav-home">
          Demo Shop
        </Link>
        <nav>
          <Link to="/products" data-testid="nav-products">
            Products
          </Link>
          <Link to="/cart" data-testid="nav-cart">
            Cart
          </Link>
          <Link to="/about" data-testid="nav-about">
            About
          </Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </>
  );
}
