import React, { ReactNode } from "react";

interface CustomButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  width?: number;
  height?: number;
  className?: string;
  buttonStyle?: "default" | "variant2"; // Only two variants
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  onClick,
  selected = false,
  width = 249,
  height = 71,
  className = "",
  buttonStyle = "default", // Default style if none is passed
}) => {
  // SVG Paths for both button styles
  const paths = {
    default: "M40.4977 8.46208C33.7601 8.81024 26.56 9.25524 20.783 10.4217C17.8932 11.0052 15.436 11.7552 13.5979 12.7199C11.7518 13.6888 10.6835 14.7912 10.284 16.0096L10.2839 16.0097C6.38579 27.8911 3.48804 39.8337 1.46307 51.7883C1.60852 51.8024 1.76279 51.8192 1.92506 51.839C3.0806 51.9803 4.66052 52.2809 6.35247 52.9222C9.75417 54.2114 13.651 56.9037 15.3611 62.4132L15.3612 62.4135C15.5768 63.109 16.4664 63.9886 18.5153 64.8794C20.4811 65.7341 23.1925 66.4612 26.4487 67.0679C32.9481 68.279 41.3673 68.9667 49.741 69.3413C58.1036 69.7154 66.3741 69.7756 72.5572 69.7419C75.6479 69.7251 78.215 69.6849 80.0086 69.6489C80.9054 69.6309 81.6087 69.614 82.0874 69.6016C82.3268 69.5954 82.5099 69.5903 82.633 69.5867L82.772 69.5827L82.8068 69.5816L82.8154 69.5814L82.8175 69.5813C82.8179 69.5813 82.818 69.5813 82.8569 70.8307L82.818 69.5813L82.831 69.5809L82.8441 69.5808C106.631 69.3364 111.717 69.0833 116.785 68.7168C117.252 68.683 117.719 68.6483 118.201 68.6125C122.999 68.2556 129.196 67.7946 150.796 67.1492C153.741 67.0613 156.693 66.9791 159.646 66.8969C176.205 66.4361 192.819 65.9737 208.719 64.4835C214.291 63.9617 221.239 62.9645 227.02 61.7037C229.914 61.0725 232.48 60.3828 234.423 59.6661C235.396 59.3072 236.18 58.9535 236.759 58.6145C237.367 58.2586 237.624 57.9905 237.704 57.8582L237.704 57.8581C246.863 42.7254 251.995 27.6648 243.208 12.696C240.956 8.86016 237.116 6.06533 230.945 4.22154C224.746 2.36909 216.293 1.50901 204.986 1.49727C204.842 1.49712 204.698 1.49696 204.555 1.4968C203.904 1.5215 203.082 1.5482 202.071 1.5771C198.804 1.67043 193.529 1.78742 185.578 1.93282L185.569 1.42193L185.578 1.93282C147.982 2.61925 110.539 4.6663 73.1078 6.71275C62.238 7.30702 51.3692 7.90124 40.4977 8.46208Z",
    
    variant2: "M208.5 8.5C216 8.8 223 9.5 229 11C231 12 234 13.5 236 15C238 16.5 239 18 241 20C244 24 246 28 247 32C248 35 248.5 39 248.5 42C248 45 247 49 246 52C245 55 243 58 241 60C239 62 234 65 229 66C219 68 199 69 177 69C144 67 109 65 89 63C64 60 39 58 29 56C21 54 14 50 11 46C1 35 -3 27 5 15C9 10 15 8 24 6C34 4 49 3 59 3C99 4 139 6 179 8C189 9 199 9 208.5 8.5Z",
  };

  return (
    <button
      tabIndex={0}
      type="button"
      onClick={onClick}
      className={`box-border flex items-center justify-center relative appearance-none bg-transparent cursor-pointer select-none align-middle text-lg font-bold transition-transform duration-300 transform hover:scale-105 shadow-md ${className}`}
      style={{ width, height }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 249 71"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0 w-full h-full"
      >
        {/* Background Shape */}
        <path
          d={paths[buttonStyle]} // Uses selected variant path
          stroke="black"
          strokeWidth="2.5"
          className={`transition-all duration-300 ${
            selected ? "fill-[rgb(219,39,119)]" : "fill-[rgb(149,255,253)]"
          }`}
        />

        {/* Button Text */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className={`transition-all duration-300 ${
            selected ? "fill-white" : "fill-black"
          }`}
          fontSize="20"
          fontWeight="bold"
          fontFamily="inherit"
          pointerEvents="none"
        >
          {children}
        </text>
      </svg>
    </button>
  );
};

export default CustomButton;
