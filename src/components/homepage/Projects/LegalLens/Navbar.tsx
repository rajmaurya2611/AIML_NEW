import { useNavigate } from "react-router-dom";
 
const Navbar: React.FC = () => {
  const navigate = useNavigate();
 
  const handleLogout = () => {
    // Clear login status (using localStorage for token)
    localStorage.removeItem("token");
    // Redirect to login page
    navigate("/legallens/login");
  };
 
  return (
    <nav className="absolute top-0 left-0 w-full bg-transparent p-4 z-20">
      <div className="container mx-auto flex justify-end">
        <button
          onClick={handleLogout}
          className="text-white hover:text-gray-300 font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
 
export default Navbar;