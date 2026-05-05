import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { colors } from "../theme/colors";

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<string | null>;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isDisabled = useMemo(() => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    return !emailValid || password.trim().length < 6;
  }, [email, password]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardWrap}
      >
        <View style={styles.content}>
          <View style={styles.brandWrap}>
            <View style={styles.brandIcon}>
              <MaterialIcons color={colors.onPrimary} name="directions" size={30} />
            </View>
            <Text style={styles.kicker}>FIELDOPS EMPLOYEE ACCESS</Text>
            <Text style={styles.title}>Sign in to continue</Text>
            <Text style={styles.subtitle}>Use your employee credentials to access trips, claims, and tracking.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              placeholder="e.g. employee@company.com"
              placeholderTextColor={colors.slate400}
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              onChangeText={(value) => {
                setPassword(value);
                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              placeholder="Enter password"
              placeholderTextColor={colors.slate400}
              secureTextEntry
              style={styles.input}
              textContentType="password"
              value={password}
            />

            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable
              disabled={isDisabled || isLoading}
              onPress={async () => {
                setIsLoading(true);
                try {
                  const nextError = await onLogin(email.trim(), password.trim());
                  setErrorMessage(nextError ?? "");
                } catch (error) {
                  console.error("Login error:", error);
                  setErrorMessage("An unexpected error occurred");
                } finally {
                  setIsLoading(false);
                }
              }}
              style={[styles.loginBtn, (isDisabled || isLoading) ? styles.loginBtnDisabled : undefined]}
            >
              <MaterialIcons color={colors.onPrimary} name="login" size={18} />
              <Text style={styles.loginBtnText}>{isLoading ? "Signing in..." : "Sign in"}</Text>
            </Pressable>

            <Text style={styles.helperText}>Employee app access only (admin, manager, accountant use web dashboard).</Text>

            <View style={styles.credentialBox}>
              <Text style={styles.credentialTitle}>Demo Credentials</Text>
              <Text style={styles.credentialItem}>employee@fieldops.com / Employee@123</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboardWrap: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 20
  },
  brandWrap: {
    gap: 6
  },
  brandIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  kicker: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  title: {
    color: colors.indigo900,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    gap: 10
  },
  label: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    borderRadius: 10,
    color: colors.onSurface,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  loginBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  loginBtnDisabled: {
    opacity: 0.5
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "700"
  },
  loginBtnText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "800"
  },
  helperText: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2
  },
  credentialBox: {
    marginTop: 6,
    backgroundColor: colors.secondaryFixed,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4
  },
  credentialTitle: {
    color: colors.onSecondaryFixed,
    fontSize: 12,
    fontWeight: "800"
  },
  credentialItem: {
    color: colors.onSecondaryFixedVariant,
    fontSize: 12,
    fontWeight: "700"
  }
});
