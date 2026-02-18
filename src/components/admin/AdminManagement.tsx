import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Plus, User, Mail, Calendar, Loader2, Trash2, Pencil, Key, ShieldCheck, ShieldAlert, QrCode } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PhoneInput } from "@/components/ui/phone-input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    email: string;
    full_name: string | null;
    phone_number: string | null;
  } | null;
  mfa_enabled?: boolean;
}

interface MfaFactor {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
}

export const AdminManagement = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMfaDialogOpen, setIsMfaDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  // MFA State
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [mfaStep, setMfaStep] = useState<"list" | "enroll" | "verify">("list");
  const [isLoadingMfa, setIsLoadingMfa] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [editFormData, setEditFormData] = useState({
    fullName: "",
    phone: "",
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          created_at,
          profile:profiles!user_roles_user_id_fkey(email, full_name, phone_number)
        `)
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to handle the profile array
      const transformedData = (data || []).map(item => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile
      }));

      setAdmins(transformedData);
    } catch (error: any) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMfaFactors = async () => {
    setIsLoadingMfa(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data?.totp || []);
    } catch (error: any) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setIsLoadingMfa(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: "admin",
          additionalData: {
            phone: formData.phone,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create admin");
      }

      // Update phone number in profile if provided
      if (formData.phone && response.data?.userId) {
        await supabase
          .from("profiles")
          .update({ phone_number: formData.phone })
          .eq("user_id", response.data.userId);
      }

      toast({
        title: "Success",
        description: "Admin user created successfully. They should enable 2FA after first login.",
      });

      setFormData({ fullName: "", email: "", password: "", phone: "" });
      setIsDialogOpen(false);
      fetchAdmins();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditFormData({
      fullName: admin.profile?.full_name || "",
      phone: admin.profile?.phone_number || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin || !editFormData.fullName) {
      toast({
        title: "Missing fields",
        description: "Please fill in the name field",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editFormData.fullName,
          phone_number: editFormData.phone || null,
        })
        .eq("user_id", editingAdmin.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin details updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      console.error("Error updating admin:", error);
      toast({
        title: "Error",
        description: "Failed to update admin details",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin access removed successfully",
      });

      fetchAdmins();
    } catch (error: any) {
      console.error("Error removing admin:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin access",
        variant: "destructive",
      });
    }
  };

  // MFA Functions
  const handleOpenMfaDialog = async () => {
    setIsMfaDialogOpen(true);
    setMfaStep("list");
    await fetchMfaFactors();
  };

  const handleEnrollMfa = async () => {
    setIsLoadingMfa(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setFactorId(data.id);
      setMfaStep("enroll");
    } catch (error: any) {
      console.error("Error enrolling MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set up 2FA",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMfa(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!factorId || verifyCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code from your authenticator app",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingMfa(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "Success",
        description: "Two-factor authentication enabled successfully!",
      });

      setVerifyCode("");
      setQrCode(null);
      setMfaSecret(null);
      setFactorId(null);
      setMfaStep("list");
      await fetchMfaFactors();
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMfa(false);
    }
  };

  const handleUnenrollMfa = async (factorIdToRemove: string) => {
    setIsLoadingMfa(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorIdToRemove,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Two-factor authentication disabled",
      });

      await fetchMfaFactors();
    } catch (error: any) {
      console.error("Error unenrolling MFA:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMfa(false);
    }
  };

  const verifiedFactors = mfaFactors.filter(f => f.status === "verified");
  const hasMfaEnabled = verifiedFactors.length > 0;

  return (
    <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
    <div className="space-y-6 pr-4">
      {/* 2FA Setup Card for Current Admin */}
      <Card className={hasMfaEnabled ? "border-green-200 dark:border-green-800" : "border-amber-200 dark:border-amber-800"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasMfaEnabled ? (
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  {hasMfaEnabled 
                    ? "Your account is protected with 2FA" 
                    : "Secure your admin account with an authenticator app"
                  }
                </CardDescription>
              </div>
            </div>
            <Button 
              variant={hasMfaEnabled ? "outline" : "default"}
              onClick={handleOpenMfaDialog}
            >
              <Key className="h-4 w-4 mr-2" />
              {hasMfaEnabled ? "Manage 2FA" : "Enable 2FA"}
            </Button>
          </div>
        </CardHeader>
        {!hasMfaEnabled && (
          <CardContent>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Security Recommendation:</strong> Super Admins should enable two-factor authentication to protect platform access. Use an authenticator app like Google Authenticator, Authy, or 1Password.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* MFA Dialog */}
      <Dialog open={isMfaDialogOpen} onOpenChange={setIsMfaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              {mfaStep === "list" && "Manage your two-factor authentication settings"}
              {mfaStep === "enroll" && "Scan the QR code with your authenticator app"}
              {mfaStep === "verify" && "Enter the code from your authenticator app"}
            </DialogDescription>
          </DialogHeader>

          {mfaStep === "list" && (
            <div className="space-y-4 py-4">
              {isLoadingMfa ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : verifiedFactors.length > 0 ? (
                <div className="space-y-3">
                  {verifiedFactors.map((factor) => (
                    <div key={factor.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">{factor.friendly_name || "Authenticator App"}</p>
                          <p className="text-xs text-muted-foreground">TOTP • Active</p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disable 2FA?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove two-factor authentication from your account. Your account will be less secure.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnenrollMfa(factor.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Disable 2FA
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">No authenticator apps configured</p>
                  <Button onClick={handleEnrollMfa} disabled={isLoadingMfa}>
                    {isLoadingMfa ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4 mr-2" />
                    )}
                    Set Up Authenticator
                  </Button>
                </div>
              )}
              
              {verifiedFactors.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleEnrollMfa}
                  disabled={isLoadingMfa}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Authenticator
                </Button>
              )}
            </div>
          )}

          {mfaStep === "enroll" && qrCode && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
              
              {mfaSecret && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Can't scan? Enter this code manually:
                  </Label>
                  <div className="p-2 bg-muted rounded font-mono text-xs break-all text-center">
                    {mfaSecret}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Enter the 6-digit code from your app</Label>
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={verifyCode}
                    onChange={setVerifyCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setMfaStep("list");
                    setQrCode(null);
                    setMfaSecret(null);
                    setVerifyCode("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleVerifyMfa}
                  disabled={verifyCode.length !== 6 || isLoadingMfa}
                >
                  {isLoadingMfa ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Super Admin Management
              </CardTitle>
              <CardDescription>
                Manage platform administrators with full access to all features
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Super Admin</DialogTitle>
                  <DialogDescription>
                    Add a new administrator with full platform access. They will receive login credentials immediately.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(v) => setFormData({ ...formData, phone: v })}
                    />
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Warning:</strong> Super Admins have complete access to all platform data. They will be prompted to enable 2FA on first login.
                    </p>
                  </div>
                  <Button 
                    onClick={handleCreateAdmin} 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Create Super Admin
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No admin users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {admin.profile?.full_name || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {admin.profile?.email || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.profile?.phone_number || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        Super Admin
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAdmin(admin)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove admin privileges from {admin.profile?.full_name || "this user"}. 
                                They will no longer be able to access admin features.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAdmin(admin.user_id, admin.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove Access
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin Details</DialogTitle>
            <DialogDescription>
              Update the admin's name and phone number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name *</Label>
              <Input
                id="editFullName"
                placeholder="Enter full name"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <PhoneInput
                value={editFormData.phone}
                onChange={(v) => setEditFormData({ ...editFormData, phone: v })}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleUpdateAdmin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Capabilities Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Super Admin Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Full Platform Access</h4>
                <p className="text-xs text-muted-foreground">Access to all dashboard sections and settings</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">User Management</h4>
                <p className="text-xs text-muted-foreground">Create, edit, and manage all user types</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Approval Authority</h4>
                <p className="text-xs text-muted-foreground">Approve companies, universities, and coordinators</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Shield className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Content Control</h4>
                <p className="text-xs text-muted-foreground">Manage internships, notifications, and reports</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Key className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Security Settings</h4>
                <p className="text-xs text-muted-foreground">Configure 2FA and manage security policies</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Shield className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Admin Management</h4>
                <p className="text-xs text-muted-foreground">Create and manage other super admins</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </ScrollArea>
  );
};
