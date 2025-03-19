import React from "react";
import { Link } from "react-router-dom";

interface CustomLinkProps {
  to: string;
  className?: string;
  children: React.ReactNode;
}

const CustomLink: React.FC<CustomLinkProps> = ({ to, className, children }) => {
  return (
    <Link
      to={to}
      className={`relative inline-flex items-center justify-center px-8 py-4 text-white font-bold text-xl transition-transform duration-300 transform hover:scale-105 border-[4px] border-black${className}`}
      style={{ width: "250px", height: "70px", position: "relative" }} // Ensuring proper positioning
    >
      {/* Background Color */}
      <span className="absolute inset-0 bg-current rounded-lg"></span>

      {/* SVG Hand-Drawn Outline */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 250 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      >
        <path
          d="M15 10C30 5 60 5 90 5C130 5 170 5 210 10C230 12 240 20 240 30C240 40 230 55 210 60C180 65 150 65 90 65C50 65 30 65 15 60C5 55 5 45 5 35C5 25 5 15 15 10Z"
          stroke="black"
          strokeWidth="4"
          fill="none"
          className="transition-all duration-300"
        />
      </svg>

      {/* Button Text (ensuring it is on top) */}
      <span className="relative z-10">{children}</span>
    </Link>
  );
};

export default CustomLink;
