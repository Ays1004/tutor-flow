import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    autoComplete?: string;
    label?: string;
    type?: string;
}

export function InputBox({
    id,
    value,
    type,
    onChange,
    placeholder,
    required,
    autoComplete = "new-password",
    label,
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="grid gap-3">
            {label && <label htmlFor={id}>{label}</label>}
            <div className="relative">
                <Input
                    id={id}
                    type={
                        type === "password"
                            ? showPassword
                                ? "text"
                                : "password"
                            : type || "text"
                    }
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    autoComplete={autoComplete}
                    className="pr-10"
                />
                {type === "password" ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        {showPassword ? (
                            <Eye size={18} />
                        ) : (
                            <EyeOff size={18} />
                        )}
                    </button>
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
}
