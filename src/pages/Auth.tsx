import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
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

type ResetStep = "idle" | "email" | "code" | "newPassword";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
    dob: "",
    school: "",
    grade: "",
    city: "",
    studentConfirm: false,
  });
  const [dobError, setDobError] = useState("");
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  // Forgot password state
  const [resetStep, setResetStep] = useState<ResetStep>("idle");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const validateDob = (dob: string) => {
    if (!dob) { setDobError("Date of birth is required"); return false; }
    const birthDate = new Date(dob);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) { setDobError("You must be at least 13 years old"); return false; }
    if (age > 22) { setDobError("NexStep is for students aged 13-22"); return false; }
    setDobError("");
    return true;
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDob(signUpData.dob)) return;
    if (!signUpData.studentConfirm) {
      toast.error("Please confirm that you are a current student");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSignUp = async () => {
    setShowConfirmDialog(false);
    setLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.fullName, {
        school: signUpData.school,
        grade: signUpData.grade,
        city: signUpData.city,
        dob: signUpData.dob,
      });
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) throw error;
      toast.success("A verification code has been sent to your email");
      setResetStep("code");
    } catch (error: any) {
      toast.error(error.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || resetCode.length < 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: resetCode,
        type: "recovery",
      });
      if (error) throw error;
      toast.success("Code verified! Set your new password.");
      setResetStep("newPassword");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Password updated! Please sign in with your new password.");
      setResetStep("idle");
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReset = () => {
    setResetStep("idle");
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  // Forgot password flow (replaces main content)
  if (resetStep !== "idle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={handleCancelReset}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </button>

          <Card className="glass-card shadow-elegant p-8 animate-scale-in">
            {resetStep === "email" && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Forgot Password</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a 6-digit verification code.
                  </p>
                </div>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@school.edu"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Code
                  </Button>
                </form>
              </>
            )}

            {resetStep === "code" && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Enter Code</h1>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to <strong>{resetEmail}</strong>. Enter it below.
                  </p>
                </div>
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-code">Verification Code</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="123456"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      disabled={loading}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={loading || resetCode.length < 6}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify Code
                  </Button>
                  <button
                    type="button"
                    onClick={() => setResetStep("email")}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
                  >
                    Didn't receive it? Try again
                  </button>
                </form>
              </>
            )}

            {resetStep === "newPassword" && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Set New Password</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your new password below.
                  </p>
                </div>
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
                  </div>
                  <div>
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
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
                <div>
                  <Label htmlFor="signup-dob">Date of Birth</Label>
                  <Input
                    id="signup-dob"
                    type="date"
                    value={signUpData.dob}
                    onChange={(e) => {
                      setSignUpData({ ...signUpData, dob: e.target.value });
                      if (e.target.value) validateDob(e.target.value);
                    }}
                    required
                    disabled={loading}
                  />
                  {dobError && <p className="text-xs text-destructive mt-1">{dobError}</p>}
                </div>
                <div>
                  <Label htmlFor="signup-school">School or College Name</Label>
                  <Input
                    id="signup-school"
                    type="text"
                    placeholder="Springfield High School"
                    value={signUpData.school}
                    onChange={(e) => setSignUpData({ ...signUpData, school: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-grade">Current Grade or Year</Label>
                  <Select
                    value={signUpData.grade}
                    onValueChange={(value) => setSignUpData({ ...signUpData, grade: value })}
                    required
                  >
                    <SelectTrigger id="signup-grade" disabled={loading}>
                      <SelectValue placeholder="Select your grade/year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                      <SelectItem value="Grade 11">Grade 11</SelectItem>
                      <SelectItem value="Grade 12">Grade 12</SelectItem>
                      <SelectItem value="College Year 1">College Year 1</SelectItem>
                      <SelectItem value="College Year 2">College Year 2</SelectItem>
                      <SelectItem value="College Year 3">College Year 3</SelectItem>
                      <SelectItem value="College Year 4">College Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="signup-city">City</Label>
                  <Input
                    id="signup-city"
                    type="text"
                    placeholder="New York"
                    value={signUpData.city}
                    onChange={(e) => setSignUpData({ ...signUpData, city: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="student-confirm"
                    checked={signUpData.studentConfirm}
                    onCheckedChange={(checked) =>
                      setSignUpData({ ...signUpData, studentConfirm: checked === true })
                    }
                    disabled={loading}
                  />
                  <Label htmlFor="student-confirm" className="text-sm leading-snug cursor-pointer">
                    I confirm I am a current school or college student
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full shadow-glow"
                  disabled={loading || !signUpData.studentConfirm || !signUpData.grade}
                >
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
                <Button type="submit" className="w-full shadow-glow" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep("email");
                      setResetEmail(signInData.email);
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
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