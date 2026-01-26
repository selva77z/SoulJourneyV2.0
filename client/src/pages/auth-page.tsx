
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Stars, Moon, Sun, ArrowRight, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";

export default function AuthPage() {
    const { signInWithGoogle, user, loading } = useAuthStore();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !loading) {
            setLocation("/");
        }
    }, [user, loading, setLocation]);

    const handleGoogleLogin = async () => {
        try {
            setIsLoggingIn(true);
            await signInWithGoogle();
            toast({
                title: "Welcome back!",
                description: "Successfully signed in with Google.",
            });
            setLocation("/");
        } catch (error: any) {
            console.error("Login failed:", error);
            toast({
                title: "Login Failed",
                description: error.message || "Could not sign in with Google.",
                variant: "destructive",
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-cosmic-midnight flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 opacity-20 animate-pulse-slow">
                    <Stars className="w-12 h-12 text-cosmic-gold" />
                </div>
                <div className="absolute bottom-20 right-20 opacity-20 animate-pulse-slow delay-1000">
                    <Moon className="w-16 h-16 text-cosmic-purple" />
                </div>
                <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cosmic-purple/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cosmic-gold/5 rounded-full blur-3xl animate-float delay-2000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md z-10"
            >
                <Card className="bg-cosmic-midnight/80 border-cosmic-purple/30 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center space-y-4 pb-8">
                        <div className="mx-auto w-16 h-16 bg-cosmic-gradient rounded-full flex items-center justify-center shadow-lg shadow-cosmic-purple/20">
                            <Sun className="w-8 h-8 text-cosmic-gold animate-spin-slow" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-display font-bold text-stellar-white mb-2">
                                Soul Journey
                            </CardTitle>
                            <CardDescription className="text-nebula-gray text-lg">
                                Discover your cosmic path
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Button
                                variant="outline"
                                className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-stellar-white flex items-center justify-center gap-3 transition-all duration-300 group"
                                onClick={handleGoogleLogin}
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <SiGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                                <span className="font-medium">Continue with Google</span>
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-cosmic-midnight px-2 text-white/40">
                                    Or continue as guest (Limited)
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <p className="mt-6 text-center text-sm text-white/40">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
}
