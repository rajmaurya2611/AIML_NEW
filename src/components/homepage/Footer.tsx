export default function Footer() {
    return (
      <footer className="bg-[#231F20] text-white pt-8 pb-4">
        <div className="container mx-auto px-6 text-center font-poppins">
          {/* Company Name */}
          <div className="">
            <h3 className="text-lg font-semibold">Motherson Technology Services Limited</h3>
          </div>

  
          {/* Copyright */}
          <div className="text-sm font-light">
            <p>&copy; {new Date().getFullYear()} MTSL. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }