import NavBar from "./navbar";
import Footer from "./footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen justify-between">
      <NavBar />
      <main className="mb-auto">{children}</main>
      <Footer />
    </div>
  );
};
export default Layout;
