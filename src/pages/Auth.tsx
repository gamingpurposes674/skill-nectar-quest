import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [changePasswordData, setChangePasswordData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });
  
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmSignUp = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.fullName);
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
      setFailedAttempts(0);
    } catch (error: any) {
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePasswordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: changePasswordData.email,
        password: changePasswordData.newPassword,
      });
      // Try to get existing session or sign in won't matter - we use updateUser
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first, then change your password from Edit Profile.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: changePasswordData.newPassword });
      if (error) throw error;
      await supabase.auth.signOut();
      setChangePasswordData({ email: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully! Please sign in with your new password.");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <Card className="glass-card shadow-elegant p-8 animate-scale-in">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gradient mb-2">Welcome to NexStep</h1>
            <p className="text-muted-foreground">Join thousands of students building their future</p>
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="change">Change Password</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignUpSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@school.edu"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
                </div>
                <Button type="submit" className="w-full gradient-primary shadow-glow" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@school.edu"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary shadow-glow" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>

                {failedAttempts >= 3 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Sign in to your account, then change your password from Edit Profile.
                  </p>
                )}
              </form>
            </TabsContent>

            <TabsContent value="change">
              <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="change-email">Email</Label>
                  <Input
                    id="change-email"
                    type="email"
                    placeholder="you@school.edu"
                    value={changePasswordData.email}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="change-new-password">New Password</Label>
                  <Input
                    id="change-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={changePasswordData.newPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
                </div>
                <div>
                  <Label htmlFor="change-confirm-password">Confirm New Password</Label>
                  <Input
                    id="change-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={changePasswordData.confirmPassword}
                    onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary shadow-glow" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New account?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to create a new NexStep account with <strong>{signUpData.email}</strong>. Would you like to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSignUp}>
              Yes, create account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Auth;
