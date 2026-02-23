import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, ArrowLeft, FileText, Database, Shield, Users, GitBranch, Layers, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="mb-10 break-inside-avoid">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 print:bg-muted">
        <Icon className="h-5 w-5 text-primary print:text-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground print:text-black">{title}</h2>
    </div>
    <div className="pl-2">{children}</div>
  </section>
);

const TableSchema = ({ name, columns, badge }: { name: string; columns: string[]; badge?: string }) => (
  <div className="mb-4 break-inside-avoid">
    <div className="flex items-center gap-2 mb-1">
      <code className="text-sm font-bold text-primary print:text-black">{name}</code>
      {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
    </div>
    <div className="text-xs text-muted-foreground leading-relaxed pl-4">
      {columns.join(' · ')}
    </div>
  </div>
);

const ArchitectureDoc = () => {
  const navigate = useNavigate();

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header - hidden in print */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Platform Architecture Documentation</h1>
          </div>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Document */}
      <ScrollArea className="h-[calc(100vh-57px)] print:h-auto">
        <div className="max-w-4xl mx-auto px-8 py-10 print:px-0 print:py-4">

          {/* Title Page */}
          <div className="text-center mb-12 print:mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground print:text-black mb-2">
              Internship Management Portal
            </h1>
            <p className="text-lg text-muted-foreground">Complete Platform Architecture Reference</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <Separator className="mb-10" />

          {/* 1. Overview */}
          <Section icon={Layers} title="1. Platform Overview">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              A comprehensive internship management platform connecting <strong>Students</strong>, <strong>Companies</strong>, and <strong>Institutional partners</strong> (Universities, Colleges, Coordinators). Built with React 18, TypeScript, Vite, Tailwind CSS, and shadcn/ui on a cloud backend with serverless edge functions.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {['React 18 + TypeScript', 'Vite + Tailwind CSS', 'shadcn/ui Components', 'Cloud Database + Auth', 'Edge Functions', 'Role-Based Access Control'].map(t => (
                <Badge key={t} variant="secondary" className="justify-center py-1.5 text-xs">{t}</Badge>
              ))}
            </div>
          </Section>

          {/* 2. Roles */}
          <Section icon={Users} title="2. User Roles & Authentication">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-2">Core Roles (app_role enum)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-lg">
                    <thead className="bg-muted/50 print:bg-muted">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Role</th>
                        <th className="text-left px-3 py-2 font-medium">Entry Point</th>
                        <th className="text-left px-3 py-2 font-medium">Dashboard Route</th>
                        <th className="text-left px-3 py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        ['admin', '/auth', '/admin/dashboard', 'Full platform control, RBAC management, user oversight'],
                        ['student', '/auth', '/student/dashboard', 'Apply to internships, maintain diary, manage profile'],
                        ['company', '/auth', '/company/dashboard', 'Post internships, review applicants, manage company profile'],
                        ['university', '/university-auth', '/university/dashboard', 'Manage colleges, coordinators, students, view logs'],
                        ['college_coordinator', '/university-auth', '/college/dashboard', 'Manage students, approve diaries, coordinate with university'],
                      ].map(([role, entry, route, desc]) => (
                        <tr key={role}>
                          <td className="px-3 py-2"><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{role}</code></td>
                          <td className="px-3 py-2 text-xs">{entry}</td>
                          <td className="px-3 py-2 text-xs font-mono">{route}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-1">Authentication Flow</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                  <li><code>/auth</code> — Standard email/password for Students & Companies (with role selection)</li>
                  <li><code>/university-auth</code> — Dedicated entry for Universities & College Coordinators</li>
                  <li>University signup handled by <code>university-signup</code> edge function</li>
                  <li>Email verification bypassed for institutional signups for immediate access</li>
                  <li>Idle timeout configurable via Platform Settings (default: 15 min)</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* 3. Routes */}
          <Section icon={GitBranch} title="3. Routing Architecture">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Public Routes</h3>
                <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                  {['/ — Landing Page', '/auth — Login / Signup', '/university-auth — Institutional Auth', '/for-universities — University Info',
                    '/internships — Browse Internships', '/internships/:id — Internship Detail', '/companies — Company Directory',
                    '/companies/:id — Company Detail', '/about — About Page', '/terms — Terms of Service', '/privacy — Privacy Policy',
                    '/notifications — Notifications', '/user-journey — Journey Map'].map(r => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Protected Routes</h3>
                <ul className="text-xs text-muted-foreground space-y-1 font-mono">
                  {['/admin/dashboard — Admin Panel (admin)', '/student/dashboard — Student Panel (student)',
                    '/company/dashboard — Company Panel (company)', '/university/dashboard — University Panel (university)',
                    '/college/dashboard — College Panel (college_coordinator)'].map(r => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  All protected routes wrapped with <code>ProtectedRoute</code> component checking <code>allowedRoles</code>.
                  Unauthorized users redirected to their appropriate dashboard.
                </p>
              </div>
            </div>
          </Section>

          {/* 4. Dashboard Tabs */}
          <Section icon={Layers} title="4. Dashboard Pages & Tabs">
            <div className="space-y-4">
              {[
                { role: 'Admin', tabs: ['Overview', 'Companies', 'Students', 'Internships', 'Universities', 'Colleges', 'Coordinators', 'Admins', 'Payments', 'Notifications', 'Banners', 'Platform Settings', 'Security Logs', 'Access Control (Roles, User Roles, Audit Log)', 'Data Export'] },
                { role: 'Student', tabs: ['Overview', 'Profile', 'Applied Internships', 'Internship Diary', 'Recommendations'] },
                { role: 'Company', tabs: ['Profile', 'Internships', 'Applicants', 'Settings'] },
                { role: 'University', tabs: ['Overview/Profile', 'Colleges', 'Coordinators', 'Students', 'Users', 'Login Logs', 'Org Chart'] },
                { role: 'College / Coordinator', tabs: ['Profile', 'Students', 'Diary Approval', 'Coordinators', 'Org Chart'] },
              ].map(d => (
                <div key={d.role} className="break-inside-avoid">
                  <h3 className="text-sm font-semibold mb-1">{d.role} Dashboard</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {d.tabs.map(t => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 5. Database Schema */}
          <Section icon={Database} title="5. Database Schema">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-2">Core Identity & Profiles</h3>
              <TableSchema name="profiles" columns={['id', 'user_id', 'email', 'full_name', 'avatar_url', 'phone_number']} />
              <TableSchema name="user_roles" columns={['id', 'user_id', 'role (app_role enum)', 'created_at']} badge="Auth" />
              <TableSchema name="students" columns={['id', 'user_id', 'university', 'degree', 'department', 'semester', 'college_id (FK→colleges)', 'skills[]', 'interested_domains[]', 'resume_url', 'cover_image_url', 'domain', 'course', 'specialization', '+ address fields', '+ social URLs']} badge="40+ columns" />
              <TableSchema name="companies" columns={['id', 'user_id', 'name', 'industry', 'location', 'is_verified', 'internship_domains[]', 'internship_skills[]', 'internship_modes[]', '+ contact fields', '+ social URLs', '+ address fields']} badge="45+ columns" />

              <Separator className="my-4" />
              <h3 className="text-sm font-semibold mb-2">Institutional Hierarchy</h3>
              <TableSchema name="universities" columns={['id', 'user_id', 'name', 'email', 'logo_url', 'is_verified', 'is_active', 'contact_person_*', 'address']} />
              <TableSchema name="colleges" columns={['id', 'university_id (FK→universities)', 'name', 'email', 'is_active', 'contact_person_*', 'address']} />
              <TableSchema name="college_coordinators" columns={['id', 'user_id', 'college_id (FK→colleges)', 'university_id (FK→universities)', 'name', 'email', 'is_approved', 'is_active']} />
              <TableSchema name="university_users" columns={['id', 'university_id (FK→universities)', 'user_id', 'email', 'name', 'is_active']} />

              <Separator className="my-4" />
              <h3 className="text-sm font-semibold mb-2">Internship Lifecycle</h3>
              <TableSchema name="internships" columns={['id', 'company_id (FK→companies)', 'title', 'description', 'domain', 'skills[]', 'internship_type', 'work_mode', 'stipend', 'fees', 'duration', 'positions_available', 'is_active', 'views_count']} />
              <TableSchema name="applications" columns={['id', 'internship_id (FK→internships)', 'student_id (FK→students)', 'status (application_status enum)', 'cover_letter', 'resume_url']} />
              <TableSchema name="internship_diary" columns={['id', 'student_id (FK→students)', 'application_id (FK→applications)', 'entry_date', 'title', 'content', 'hours_worked', 'skills_learned[]', 'is_approved', 'approved_by', 'coordinator_remarks']} />

              <Separator className="my-4" />
              <h3 className="text-sm font-semibold mb-2">RBAC & Permissions</h3>
              <TableSchema name="custom_roles" columns={['id', 'name', 'description', 'scope', 'is_system', 'created_by']} />
              <TableSchema name="permissions" columns={['id', 'key', 'label', 'group_name', 'group_order', 'permission_order']} badge="76 keys" />
              <TableSchema name="custom_role_permissions" columns={['id', 'role_id (FK→custom_roles)', 'permission_id (FK→permissions)']} />
              <TableSchema name="user_custom_roles" columns={['id', 'user_id', 'role_id (FK→custom_roles)', 'assigned_by']} />
              <TableSchema name="role_permissions" columns={['id', 'role', 'feature_key', 'is_enabled', 'settings (JSONB)', 'visible_fields[]', 'hidden_fields[]']} badge="Legacy toggles" />
              <TableSchema name="user_permissions" columns={['id', 'user_id', 'feature_key', 'is_enabled', 'settings (JSONB)', 'visible_fields[]', 'hidden_fields[]']} badge="User overrides" />
              <TableSchema name="rbac_audit_logs" columns={['id', 'performed_by', 'action', 'entity_type', 'entity_id', 'entity_name', 'details (JSONB)']} />

              <Separator className="my-4" />
              <h3 className="text-sm font-semibold mb-2">Platform & Support</h3>
              <TableSchema name="notifications" columns={['id', 'user_id', 'title', 'message', 'type', 'is_read', 'link', 'target_role']} />
              <TableSchema name="subscriptions" columns={['id', 'user_id', 'type']} />
              <TableSchema name="payment_transactions" columns={['id', 'internship_id', 'student_id', 'company_id', 'amount', 'currency', 'transaction_type', 'status', 'payment_method', 'reference_id']} />
              <TableSchema name="company_limits" columns={['id', 'company_id (FK→companies)', 'max_internships', 'max_active_internships', 'can_post_paid_internships', 'can_view_resumes', 'can_feature_listings']} />
              <TableSchema name="login_logs" columns={['id', 'user_id', 'user_email', 'role', 'ip_address', 'user_agent', 'login_at']} />
              <TableSchema name="platform_settings" columns={['id', 'key', 'value (JSONB)', 'updated_by']} />
              <TableSchema name="advertisement_banners" columns={['id', 'title', 'image_url', 'link_url', 'position', 'is_active', 'priority', 'target_roles[]', 'target_regions[]', 'target_cities[]', 'start_date', 'end_date']} />
            </div>

            <div className="mt-6 break-inside-avoid">
              <h3 className="text-sm font-semibold mb-2">Database Enums</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { name: 'app_role', values: ['admin', 'student', 'company', 'university', 'college_coordinator'] },
                  { name: 'application_status', values: ['applied', 'under_review', 'shortlisted', 'offer_released', 'offer_accepted', 'rejected', 'withdrawn'] },
                  { name: 'internship_type', values: ['free', 'paid', 'stipended'] },
                  { name: 'work_mode', values: ['remote', 'onsite', 'hybrid'] },
                ].map(e => (
                  <div key={e.name}>
                    <code className="text-xs font-bold">{e.name}</code>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {e.values.map(v => <Badge key={v} variant="outline" className="text-xs">{v}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 6. RBAC */}
          <Section icon={Shield} title="6. RBAC Architecture">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Permission Resolution (3 Layers)</h3>
                <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-5">
                  <li><strong>Legacy Feature Toggles</strong> (<code>role_permissions</code>) — Broad on/off switches per role+feature. Disabling a feature here revokes all associated granular permissions.</li>
                  <li><strong>Granular RBAC Permissions</strong> (<code>custom_role_permissions</code>) — 76 semantic permission keys assigned to custom roles (e.g., <code>students.view</code>, <code>internships.create</code>). Roles scoped to: super_admin, admin, university, college, coordinator, company, student.</li>
                  <li><strong>User-Level Overrides</strong> (<code>user_permissions</code>) — Individual user overrides that take highest priority.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Resolution Logic</h3>
                <div className="bg-muted/50 print:bg-muted rounded-lg p-4 text-xs font-mono leading-relaxed">
                  <p>1. If role === 'admin' → ALLOW (bypass all checks)</p>
                  <p>2. Check user_permissions for user-level override → use if found</p>
                  <p>3. Check role_permissions for legacy feature toggle → deny if disabled</p>
                  <p>4. Check custom_role_permissions via user_custom_roles → allow if matched</p>
                  <p>5. Default → ALLOW (no record = permitted)</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Frontend Implementation</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                  <li><code>usePermissions()</code> hook — Single source of truth for permission checks</li>
                  <li><code>useRolePermissions()</code> hook — Legacy feature toggle checks</li>
                  <li><code>{'<PermissionGate>'}</code> component — Conditional rendering based on permissions</li>
                  <li><code>{'<ProtectedRoute>'}</code> component — Route-level role gating</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">System Role Templates</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['College Admin', 'Coordinator Viewer', 'Report Manager', 'University Admin', 'University Viewer', 'Coordinator Admin', 'Coordinator Standard'].map(r => (
                    <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">System roles are cloneable templates for quick custom role creation.</p>
              </div>
            </div>
          </Section>

          {/* 7. Edge Functions */}
          <Section icon={Server} title="7. Edge Functions (Serverless)">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead className="bg-muted/50 print:bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Function</th>
                    <th className="text-left px-3 py-2 font-medium">Auth</th>
                    <th className="text-left px-3 py-2 font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {[
                    ['university-signup', 'Public', 'Creates university auth user, profile, user_role, and universities record'],
                    ['create-college-account', 'Public', 'Creates college auth user (college_coordinator role), links to college & university'],
                    ['create-coordinator-account', 'Public', 'Creates coordinator auth user, links to college_coordinators table'],
                    ['admin-create-user', 'Public', 'Admin-initiated user creation with role assignment'],
                  ].map(([fn, auth, purpose]) => (
                    <tr key={fn}>
                      <td className="px-3 py-2 font-mono">{fn}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{auth}</Badge></td>
                      <td className="px-3 py-2 text-muted-foreground">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 8. Workflow */}
          <Section icon={GitBranch} title="8. Workflow Summary">
            <div className="space-y-4 text-xs text-muted-foreground">
              <div className="break-inside-avoid">
                <h3 className="text-sm font-semibold text-foreground print:text-black mb-1">Institutional Onboarding</h3>
                <p>University registers → Creates Colleges (edge function) → College creates Coordinators (edge function) → Students self-register & link via college_id</p>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-sm font-semibold text-foreground print:text-black mb-1">Internship Lifecycle</h3>
                <p>Company posts internship → Students browse & apply → Company reviews (under_review → shortlisted → offer_released) → Student accepts/rejects → Student submits diary entries → Coordinator/College approves diary</p>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-sm font-semibold text-foreground print:text-black mb-1">Admin Oversight</h3>
                <p>Admin manages all entities, configures platform settings (13 categories), manages RBAC roles & permissions, views security logs & audit trail, handles company approvals & limits</p>
              </div>
              <div className="break-inside-avoid">
                <h3 className="text-sm font-semibold text-foreground mb-1">Application Status Flow</h3>
                <div className="bg-muted/50 rounded-lg p-3 font-mono mt-1">
                  applied → under_review → shortlisted → offer_released → offer_accepted / rejected / withdrawn
                </div>
              </div>
            </div>
          </Section>

          {/* 9. RLS */}
          <Section icon={Shield} title="9. Row-Level Security Summary">
            <p className="text-xs text-muted-foreground mb-3">Every table has RLS enabled. Key patterns:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
              <li><strong>Admin bypass:</strong> <code>has_role(auth.uid(), 'admin')</code> grants full access on all tables</li>
              <li><strong>Owner access:</strong> Users can CRUD their own records via <code>user_id = auth.uid()</code></li>
              <li><strong>Hierarchy scoping:</strong> Universities see their colleges/coordinators; Coordinators see their college's students</li>
              <li><strong>Public reads:</strong> Companies, internships (active), profiles, colleges, permissions are publicly readable</li>
              <li><strong>Immutable logs:</strong> login_logs and rbac_audit_logs cannot be updated or deleted</li>
              <li><strong>Company limits:</strong> Companies can only view their own limits; admins manage all</li>
            </ul>
          </Section>

          {/* Footer */}
          <Separator className="my-6" />
          <div className="text-center text-xs text-muted-foreground pb-8">
            <p>Internship Management Portal — Architecture Documentation</p>
            <p>Generated {new Date().toISOString()}</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ArchitectureDoc;
