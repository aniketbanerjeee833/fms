import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLogoutUserMutation } from "../../redux/api/userApi";
import { setUser, setUserId } from "../../redux/reducer/userReducer";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import MobileSideMenu from "../MobileSideMenu/MobileSideMenu";
import { LogOut,ChevronUp, ChevronDown } from 'lucide-react';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
 const[mobileViewSideBarOpen, setMobileViewSideBarOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
   const dispatch = useDispatch();
   const IconComponent = dropdownOpen ? ChevronUp : ChevronDown;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    console.log("Dropdown toggled", !dropdownOpen);
    setDropdownOpen(!dropdownOpen);
  };

  const[logoutUser]= useLogoutUserMutation();

  const handleLogout = async (e) => {
    

    try{
      const response = await logoutUser().unwrap();
      console.log("Logout Response:", response);
      if(response.success){
        console.log(response.message);
        // ✅ Clear Redux user slice completely
        // dispatch(setLoggedIn(false));
        dispatch(setUserId(null));
         dispatch(setUser(null));
         toast.success(response?.message || 'Logout successful');
        window.location.href = "/login"; // hard redirect clears memory
    }
  } catch(err){
    console.error('Logout error:', err);
    toast.error(err?.data?.message || 'Logout failed');
  }
  // console.error('Server responded with:', error.response.data);
  //     }
    }
  const handleToggleMobileViewOpen = () => {
    setMobileViewSideBarOpen(!mobileViewSideBarOpen);
  };
  
  const handleCloseMobileMenu = () => {
    setMobileViewSideBarOpen(false);
  };

  return (
    <>
       
        <div className="container-fluid sb1 ">
          <div className="row ">
               

<div className="w-full flex flex-wrap items-center justify-between ">

  {/* LEFT SECTION */}
  <div className="flex items-center gap-2 flex-shrink-0 mb-2 sm:mb-0">
    <span
      className="atab-menu cursor-pointer block sm:hidden"
      onClick={() => handleToggleMobileViewOpen()}
    >
      <i className="fa fa-bars tab-menu text-lg"></i>
    </span>

    {/* <i className="fa fa-cubes text-xl text-blue-500"></i>

    <span className="font-semibold text-base sm:text-lg whitespace-nowrap">
      Inventory Management
    </span> */}
    <div className="ml-2">
     <img src="/assets/images/techeasy_logo.png" className="w-50" alt="" />
     </div>
  </div>

  {/* RIGHT SECTION */}
  <div className="flex items-center gap-2 sm:gap-4 ">

    {/* Buttons */}
    <button
      type="button"
      style={{backgroundColor:"red"}}
      onClick={() => navigate("/purchase/add")}
      className="text-white text-sm sm:text-base font-semibold py-2 px-3 
      sm:px-4 rounded"
    >
      Add Purchase
    </button>

    <button
      type="button"
       style={{backgroundColor:"green"}}
      onClick={() => navigate("/sale/add")}
      className="text-white text-sm sm:text-base font-semibold py-2 px-3 sm:px-4 
      rounded "
    >
      Add Sale
    </button>

    {/* ADMIN DROPDOWN */}
    <div ref={dropdownRef} className="relative">
      <NavLink
        className="top-user-pro flex items-center cursor-pointer text-sm sm:text-base"
        onClick={(e) => {
          e.preventDefault();
          toggleDropdown();
        }}
      >
        Admin Account
        <IconComponent size={18} className="ml-1" />
      </NavLink>

      {dropdownOpen && (
        <ul
          className="absolute bg-white border rounded-md shadow-lg z-50 top-10
           min-w-[150px] mt-1 right-0"
        >
          <li>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              className="w-full text-left flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
              style={{backgroundColor:"transparent"}}
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </li>
        </ul>
      )}
    </div>
  </div>

</div>

      </div>
    </div>
  
  {mobileViewSideBarOpen && 
     <div className="sb2-1">
  <MobileSideMenu onClose={handleCloseMobileMenu} 
  
  />
   </div>}
   
    </>
  );
};
export default Header;