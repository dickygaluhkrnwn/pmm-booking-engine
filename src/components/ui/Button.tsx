"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyle = "relative flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold transition-colors overflow-hidden";
  
  const variants = {
    primary: "bg-navy text-white hover:bg-[#122643] shadow-xl shadow-navy/20",
    secondary: "bg-gold text-navy hover:bg-[#E5C158] shadow-xl shadow-gold/20",
    outline: "bg-transparent border border-navy text-navy hover:bg-navy/5",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
};