import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Pressable,
    Image,
} from "react-native";

import { useState, useRef } from "react";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons } from "@expo/vector-icons";

import colors from "../constants/color";

import backArrow from "../assets/icons/backArrow.png";
import rightArrow from "../assets/icons/rightArrow.png";
import googleIcon from "../assets/icons/google.png"

export default function SignIn() {

    const [focusedInput, setFocusedInput] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [password, setPassword] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [popupData, setPopupData] = useState({
        type: "",
        message: "",
    });
    const inputRefs = useRef({});

    const showPopupMessage = (type, message) => {

        setPopupData({
            type,
            message,
        });

        setShowPopup(true);

        setTimeout(() => {
            setShowPopup(false);
        }, 4000);
    };

    const handleLogin = async () => {

        let newErrors = {};

        if (!email.trim()) {
            newErrors.email = "Email is required";
        }

        if (!password.trim()) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);

        // STOP LOGIN IF ERRORS EXIST
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        try {

            const form = new URLSearchParams();

            form.append("email", email);
            form.append("password", password);

            const response = await fetch(
                "https://agapi-media.episyche.com/accounts/login/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },

                    body: form.toString(),
                }
            );

            const data = await response.json();

            console.log(data);

            // SUCCESS
            if (response.status === 200) {

                showPopupMessage(
                    "success",
                    "Login successful! Redirecting..."
                );

            }

            // ERROR
            else {

                showPopupMessage(
                    "error",
                    data.message || "Something went wrong"
                );
            }

        } catch (error) {

            showPopupMessage(
                "error",
                "Something went wrong"
            );

            console.log(error);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <LinearGradient
                        colors={["#2B0A57", "#1A093D"]}
                        style={styles.topSection}
                    >
                        <Text style={styles.heading}>
                            Grow 10x Faster with our
                        </Text>

                        <Text style={styles.subHeading}>
                            Sales & Marketing Agents.
                        </Text>
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.content}>

                        {/* Title */}
                        <View style={styles.titleRow}>
                            <Image
                                source={backArrow}
                                style={{
                                    width: 27,
                                    height: 27,
                                    marginTop: 3,
                                }}
                            />

                            <Text style={styles.signInText}>
                                Sign In
                            </Text>
                        </View>

                        {/* Email */}
                        <Text style={styles.label}>Email</Text>

                        <Pressable
                            onPress={() =>
                                inputRefs.current.email?.focus()
                            }
                            style={[
                                styles.inputContainer,
                                focusedInput === "email" &&
                                styles.inputFocused,
                            ]}
                        >
                            <Ionicons
                                name="mail"
                                size={18}
                                color="#6B7280"
                            />

                            <TextInput
                                ref={(ref) => {
                                    inputRefs.current.email = ref;
                                }}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="name@company.com"
                                placeholderTextColor="#6B7280"
                                style={styles.input}
                                onFocus={() =>
                                    setFocusedInput("email")
                                }
                                onBlur={() =>
                                    setFocusedInput(null)
                                }
                            />
                        </Pressable>
                        {errors.email && (
                            <Text style={styles.errorText}>
                                {errors.email}
                            </Text>
                        )}

                        {/* Password */}
                        <Text style={styles.label}>Password</Text>

                        <Pressable
                            onPress={() =>
                                inputRefs.current.password?.focus()
                            }
                            style={[
                                styles.inputContainer,
                                focusedInput === "password" &&
                                styles.inputFocused,
                            ]}
                        >
                            <Ionicons
                                name="lock-closed"
                                size={18}
                                color="#6B7280"
                            />

                            <TextInput
                                ref={(ref) => {
                                    inputRefs.current.password = ref;
                                }}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="••••••••"
                                placeholderTextColor="#6B7280"
                                style={styles.input}
                                onFocus={() =>
                                    setFocusedInput("password")
                                }
                                onBlur={() =>
                                    setFocusedInput(null)
                                }
                            />

                            <Pressable
                                onPress={() =>
                                    setShowPassword((prev) => !prev)
                                }
                            >
                                <Ionicons
                                    name={
                                        showPassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={18}
                                    color="#6B7280"
                                />
                            </Pressable>
                        </Pressable>
                        {errors.password && (
                            <Text style={styles.errorText}>
                                {errors.password}
                            </Text>
                        )}

                        {/* Forgot */}
                        <Pressable style={({ pressed }) => [
                            styles.forgotButton,
                            pressed && { opacity: 0.7 },
                        ]}>
                            <Text style={styles.forgot}>
                                Forgot password?
                            </Text>
                        </Pressable>

                        {/* SingIn button */}
                        <Pressable
                            onPress={handleLogin}
                            style={({ pressed }) => [
                                pressed && {
                                    opacity: 0.9,
                                },
                            ]}
                        >
                            <LinearGradient
                                colors={[
                                    colors.purple,
                                    colors.pink,
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>
                                    Sign in
                                </Text>
                                <Image
                                    source={rightArrow}
                                    style={{
                                        width: 18,
                                        height: 18,
                                        marginTop: 3
                                    }}
                                />
                            </LinearGradient>
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.line} />

                            <Text style={styles.dividerText}>
                                Or continue with
                            </Text>

                            <View style={styles.line} />
                        </View>

                        {/* Google button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.googleButton,
                                pressed && { opacity: 0.8 },
                            ]}
                        >
                            <Image
                                source={googleIcon}
                                style={{
                                    width: 22,
                                    height: 22,
                                    marginTop: 3,
                                }}
                            />

                            <Text style={styles.googleText}>
                                Google
                            </Text>
                        </Pressable>

                        {/* Footer */}
                        <View style={styles.footerRow}>
                            <Text style={styles.footerText}>
                                Don't have an account?
                            </Text>

                            <Pressable
                                style={({ pressed }) => [
                                    pressed && { opacity: 0.7 },
                                ]}
                            >
                                <Text style={styles.signup}>
                                    {" "}
                                    Sign up
                                </Text>
                            </Pressable>
                        </View>

                    </View>
                </View>
                {showPopup && (
                    <View style={styles.popupOverlay}>
                        <View style={styles.popupCard}>

                            <Ionicons
                                name={
                                    popupData.type === "success"
                                        ? "checkmark-circle"
                                        : "close-circle"
                                }
                                size={80}
                                color={
                                    popupData.type === "success"
                                        ? "#22c55e"
                                        : "#ef4444"
                                }
                            />

                            <Text
                                style={[
                                    styles.popupText,
                                    {
                                        color:
                                            popupData.type === "success"
                                                ? "#c084fc"
                                                : "#ef4444",
                                    },
                                ]}
                            >
                                {popupData.message}
                            </Text>

                        </View>
                    </View>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },

    card: {
        width: "100%",
        backgroundColor: colors.card,
        borderRadius: 20,
        overflow: "hidden",
    },

    topSection: {
        padding: 28,
    },

    heading: {
        color: "white",
        fontSize: 24,
        fontWeight: "700",
        lineHeight: 38,
    },
    subHeading: {
        color: "#e9d5ff",
        fontSize: 23,
        fontWeight: "700",
        lineHeight: 38,
    },

    content: {
        padding: 22,
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 28,
    },

    signInText: {
        color: "white",
        fontSize: 30,
        fontWeight: "700",
    },

    label: {
        color: "white",
        marginBottom: 10,
        marginTop: 10,
        fontSize: 15,
    },

    inputContainer: {
        height: 58,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        backgroundColor: colors.input,

        flexDirection: "row",
        alignItems: "center",

        paddingHorizontal: 16,
        gap: 12,
    },

    input: {
        flex: 1,
        color: "white",
        fontSize: 16,
    },
    inputFocused: {
        borderColor: colors.inputBorder
    },
    forgotButton: {
        alignSelf: "flex-end",
    },

    forgot: {
        color: colors.pink,
        marginTop: 10,
        marginBottom: 24,
        fontWeight: "600",
    },

    button: {
        height: 58,
        borderRadius: 14,
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        alignItems: "center",
    },

    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
    },

    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 28,
        gap: 10,
    },

    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },

    dividerText: {
        color: colors.textSecondary,
        fontSize: 16
    },

    googleButton: {
        height: 56,
        width: 130,
        alignSelf: "center",
        borderRadius: 34,
        borderWidth: 1,
        borderColor: colors.border,

        justifyContent: "center",
        alignItems: "center",

        flexDirection: "row",
        gap: 10,
    },

    googleText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },

    footerRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 30,
    },

    footerText: {
        color: colors.textSecondary,
        fontSize: 16
    },

    signup: {
        color: colors.pink,
        fontWeight: "700",
    },
    errorText: {
        color: "#ff4d4f",
        marginTop: 8,
        fontSize: 13,
    },
    popupOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        justifyContent: "center",
        alignItems: "center",

        backgroundColor: "rgba(0,0,0,0.6)",
    },

    popupCard: {
        width: "85%",
        backgroundColor: "#0B0F1A",
        borderRadius: 24,
        overflow: "hidden",
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 20,
    },

    popupText: {
        marginTop: 20,
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
    },
});