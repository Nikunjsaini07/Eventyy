import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./footer";

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-[4.5rem]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
