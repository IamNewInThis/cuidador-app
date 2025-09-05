import { TextInput } from 'react-native';
import React from 'react';

const Input = ({ placeholder, type, className, secureTextEntry, ...props }) => {
    return (
        <TextInput
            placeholder={placeholder}
            type={type}
            className={`w-full h-12 px-4 border border-gray-300 rounded-lg bg-gray-50 text-base ${className}`}
            {...props}
            secureTextEntry={secureTextEntry}
        />
    );
};

export default Input;