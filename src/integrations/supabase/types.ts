export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_size: number | null
          file_url: string
          filename: string
          id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url: string
          filename: string
          id?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string
          filename?: string
          id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          id: string
          internship_id: string
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          internship_id: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          id?: string
          internship_id?: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      college_coordinators: {
        Row: {
          address: string | null
          college_id: string | null
          created_at: string
          designation: string | null
          email: string
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          name: string
          phone: string | null
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          college_id?: string | null
          created_at?: string
          designation?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          name: string
          phone?: string | null
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          college_id?: string | null
          created_at?: string
          designation?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          name?: string
          phone?: string | null
          university_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_coordinators_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_coordinators_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          address: string | null
          contact_person_designation: string | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          university_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          university_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colleges_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          about_company: string | null
          address: string | null
          awards: string[] | null
          certifications: string[] | null
          city: string | null
          company_profile_url: string | null
          contact_person_designation: string | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          custom_domains: string[] | null
          declaration_accepted: boolean | null
          description: string | null
          designation_email: string | null
          designation_name: string | null
          designation_phone: string | null
          designation_title: string | null
          domain_category: string | null
          employee_count: string | null
          facebook_url: string | null
          founded_year: number | null
          gst_pan: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          internship_domain: string | null
          internship_domains: string[] | null
          internship_duration: string | null
          internship_durations: string[] | null
          internship_mode: string | null
          internship_modes: string[] | null
          internship_skills: string[] | null
          is_verified: boolean | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          long_description: string | null
          name: string
          postal_code: string | null
          registration_profile_url: string | null
          short_description: string | null
          state: string | null
          stipend_offered: string | null
          terms_accepted: boolean | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          about_company?: string | null
          address?: string | null
          awards?: string[] | null
          certifications?: string[] | null
          city?: string | null
          company_profile_url?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_domains?: string[] | null
          declaration_accepted?: boolean | null
          description?: string | null
          designation_email?: string | null
          designation_name?: string | null
          designation_phone?: string | null
          designation_title?: string | null
          domain_category?: string | null
          employee_count?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          gst_pan?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          internship_domain?: string | null
          internship_domains?: string[] | null
          internship_duration?: string | null
          internship_durations?: string[] | null
          internship_mode?: string | null
          internship_modes?: string[] | null
          internship_skills?: string[] | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          long_description?: string | null
          name: string
          postal_code?: string | null
          registration_profile_url?: string | null
          short_description?: string | null
          state?: string | null
          stipend_offered?: string | null
          terms_accepted?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          about_company?: string | null
          address?: string | null
          awards?: string[] | null
          certifications?: string[] | null
          city?: string | null
          company_profile_url?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_domains?: string[] | null
          declaration_accepted?: boolean | null
          description?: string | null
          designation_email?: string | null
          designation_name?: string | null
          designation_phone?: string | null
          designation_title?: string | null
          domain_category?: string | null
          employee_count?: string | null
          facebook_url?: string | null
          founded_year?: number | null
          gst_pan?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          internship_domain?: string | null
          internship_domains?: string[] | null
          internship_duration?: string | null
          internship_durations?: string[] | null
          internship_mode?: string | null
          internship_modes?: string[] | null
          internship_skills?: string[] | null
          is_verified?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          long_description?: string | null
          name?: string
          postal_code?: string | null
          registration_profile_url?: string | null
          short_description?: string | null
          state?: string | null
          stipend_offered?: string | null
          terms_accepted?: boolean | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_limits: {
        Row: {
          can_feature_listings: boolean
          can_post_free_internships: boolean
          can_post_paid_internships: boolean
          can_view_resumes: boolean
          can_view_student_contact: boolean
          company_id: string
          created_at: string
          id: string
          max_active_internships: number
          max_applications_per_internship: number
          max_internships: number
          notes: string | null
          set_by: string | null
          updated_at: string
        }
        Insert: {
          can_feature_listings?: boolean
          can_post_free_internships?: boolean
          can_post_paid_internships?: boolean
          can_view_resumes?: boolean
          can_view_student_contact?: boolean
          company_id: string
          created_at?: string
          id?: string
          max_active_internships?: number
          max_applications_per_internship?: number
          max_internships?: number
          notes?: string | null
          set_by?: string | null
          updated_at?: string
        }
        Update: {
          can_feature_listings?: boolean
          can_post_free_internships?: boolean
          can_post_paid_internships?: boolean
          can_view_resumes?: boolean
          can_view_student_contact?: boolean
          company_id?: string
          created_at?: string
          id?: string
          max_active_internships?: number
          max_applications_per_internship?: number
          max_internships?: number
          notes?: string | null
          set_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_limits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          scope?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_access_config: {
        Row: {
          created_at: string
          feature_key: string
          feature_label: string
          id: string
          is_locked: boolean
          role: string
          updated_at: string
          updated_by: string | null
          upgrade_message: string | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          feature_label: string
          id?: string
          is_locked?: boolean
          role: string
          updated_at?: string
          updated_by?: string | null
          upgrade_message?: string | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          feature_label?: string
          id?: string
          is_locked?: boolean
          role?: string
          updated_at?: string
          updated_by?: string | null
          upgrade_message?: string | null
        }
        Relationships: []
      }
      institutional_memos: {
        Row: {
          attachments: Json | null
          body: string
          college_id: string | null
          created_at: string
          id: string
          parent_memo_id: string | null
          priority: string
          read_at: string | null
          recipient_id: string | null
          recipient_type: string
          sender_id: string
          sender_name: string
          sender_role: string
          status: string
          subject: string
          university_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          college_id?: string | null
          created_at?: string
          id?: string
          parent_memo_id?: string | null
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type: string
          sender_id: string
          sender_name: string
          sender_role: string
          status?: string
          subject: string
          university_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          college_id?: string | null
          created_at?: string
          id?: string
          parent_memo_id?: string | null
          priority?: string
          read_at?: string | null
          recipient_id?: string | null
          recipient_type?: string
          sender_id?: string
          sender_name?: string
          sender_role?: string
          status?: string
          subject?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institutional_memos_parent_memo_id_fkey"
            columns: ["parent_memo_id"]
            isOneToOne: false
            referencedRelation: "institutional_memos"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_diary: {
        Row: {
          application_id: string
          approved_at: string | null
          approved_by: string | null
          content: string
          coordinator_remarks: string | null
          created_at: string
          entry_date: string
          hours_worked: number | null
          id: string
          is_approved: boolean | null
          skills_learned: string[] | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          application_id: string
          approved_at?: string | null
          approved_by?: string | null
          content: string
          coordinator_remarks?: string | null
          created_at?: string
          entry_date: string
          hours_worked?: number | null
          id?: string
          is_approved?: boolean | null
          skills_learned?: string[] | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          approved_at?: string | null
          approved_by?: string | null
          content?: string
          coordinator_remarks?: string | null
          created_at?: string
          entry_date?: string
          hours_worked?: number | null
          id?: string
          is_approved?: boolean | null
          skills_learned?: string[] | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_diary_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_diary_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          application_deadline: string | null
          company_id: string
          created_at: string
          description: string
          domain: string | null
          duration: string | null
          fees: number | null
          id: string
          internship_type: Database["public"]["Enums"]["internship_type"]
          is_active: boolean | null
          is_paid: boolean | null
          location: string | null
          positions_available: number | null
          short_description: string | null
          skills: string[] | null
          start_date: string | null
          stipend: number | null
          title: string
          updated_at: string
          views_count: number | null
          work_mode: Database["public"]["Enums"]["work_mode"]
        }
        Insert: {
          application_deadline?: string | null
          company_id: string
          created_at?: string
          description: string
          domain?: string | null
          duration?: string | null
          fees?: number | null
          id?: string
          internship_type?: Database["public"]["Enums"]["internship_type"]
          is_active?: boolean | null
          is_paid?: boolean | null
          location?: string | null
          positions_available?: number | null
          short_description?: string | null
          skills?: string[] | null
          start_date?: string | null
          stipend?: number | null
          title: string
          updated_at?: string
          views_count?: number | null
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Update: {
          application_deadline?: string | null
          company_id?: string
          created_at?: string
          description?: string
          domain?: string | null
          duration?: string | null
          fees?: number | null
          id?: string
          internship_type?: Database["public"]["Enums"]["internship_type"]
          is_active?: boolean | null
          is_paid?: boolean | null
          location?: string | null
          positions_available?: number | null
          short_description?: string | null
          skills?: string[] | null
          start_date?: string | null
          stipend?: number | null
          title?: string
          updated_at?: string
          views_count?: number | null
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "internships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string
          role: string
          user_agent: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string
          role: string
          user_agent?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string
          role?: string
          user_agent?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          sender_id: string | null
          target_role: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          sender_id?: string | null
          target_role?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          sender_id?: string | null
          target_role?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string
          currency: string
          id: string
          internship_id: string | null
          notes: string | null
          payment_method: string | null
          processed_by: string | null
          reference_id: string | null
          status: string
          student_id: string | null
          subscription_id: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          internship_id?: string | null
          notes?: string | null
          payment_method?: string | null
          processed_by?: string | null
          reference_id?: string | null
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          internship_id?: string | null
          notes?: string | null
          payment_method?: string | null
          processed_by?: string | null
          reference_id?: string | null
          status?: string
          student_id?: string | null
          subscription_id?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          group_name: string
          group_order: number
          id: string
          key: string
          label: string
          permission_order: number
        }
        Insert: {
          created_at?: string
          group_name: string
          group_order?: number
          id?: string
          key: string
          label: string
          permission_order?: number
        }
        Update: {
          created_at?: string
          group_name?: string
          group_order?: number
          id?: string
          key?: string
          label?: string
          permission_order?: number
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      plugin_usage_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          plugin_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          plugin_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          plugin_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_usage_logs_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          allowed_roles: string[] | null
          api_key_name: string | null
          category: string
          config: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          installed_by: string | null
          is_enabled: boolean
          is_installed: boolean
          name: string
          slug: string
          updated_at: string
          version: string | null
          webhook_events: string[] | null
          webhook_url: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          api_key_name?: string | null
          category?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          installed_by?: string | null
          is_enabled?: boolean
          is_installed?: boolean
          name: string
          slug: string
          updated_at?: string
          version?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          api_key_name?: string | null
          category?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          installed_by?: string | null
          is_enabled?: boolean
          is_installed?: boolean
          name?: string
          slug?: string
          updated_at?: string
          version?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          attempted_at: string
          id: string
          ip_hash: string
        }
        Insert: {
          action: string
          attempted_at?: string
          id?: string
          ip_hash: string
        }
        Update: {
          action?: string
          attempted_at?: string
          id?: string
          ip_hash?: string
        }
        Relationships: []
      }
      rbac_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          performed_by?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          feature_key: string
          hidden_fields: string[] | null
          id: string
          is_enabled: boolean | null
          role: string
          settings: Json | null
          updated_at: string
          updated_by: string | null
          visible_fields: string[] | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          hidden_fields?: string[] | null
          id?: string
          is_enabled?: boolean | null
          role: string
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
          visible_fields?: string[] | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          hidden_fields?: string[] | null
          id?: string
          is_enabled?: boolean | null
          role?: string
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
          visible_fields?: string[] | null
        }
        Relationships: []
      }
      student_attendance: {
        Row: {
          attendance_date: string
          check_in_time: string | null
          check_out_time: string | null
          college_id: string
          created_at: string
          hours_logged: number | null
          id: string
          marked_by: string | null
          remarks: string | null
          session_name: string | null
          session_type: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          check_in_time?: string | null
          check_out_time?: string | null
          college_id: string
          created_at?: string
          hours_logged?: number | null
          id?: string
          marked_by?: string | null
          remarks?: string | null
          session_name?: string | null
          session_type?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          college_id?: string
          created_at?: string
          hours_logged?: number | null
          id?: string
          marked_by?: string | null
          remarks?: string | null
          session_name?: string | null
          session_type?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          about_me: string | null
          accuracy_confirmation: boolean | null
          address: string | null
          bio: string | null
          city: string | null
          college: string | null
          college_id: string | null
          college_id_url: string | null
          country: string | null
          course: string | null
          cover_image_url: string | null
          created_at: string
          custom_course: string | null
          custom_domain: string | null
          degree: string | null
          department: string | null
          dob: string | null
          domain: string | null
          facebook_url: string | null
          gender: string | null
          github_url: string | null
          graduation_year: number | null
          id: string
          instagram_url: string | null
          interested_domains: string[] | null
          linkedin_url: string | null
          other_social_url: string | null
          permanent_address: string | null
          permanent_city: string | null
          permanent_country: string | null
          permanent_state: string | null
          reddit_url: string | null
          resume_url: string | null
          semester: number | null
          skills: string[] | null
          slack_url: string | null
          specialization: string | null
          state: string | null
          terms_accepted: boolean | null
          twitter_url: string | null
          university: string | null
          updated_at: string
          user_id: string
          usn: string | null
          year_of_study: number | null
        }
        Insert: {
          about_me?: string | null
          accuracy_confirmation?: boolean | null
          address?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          college_id?: string | null
          college_id_url?: string | null
          country?: string | null
          course?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_course?: string | null
          custom_domain?: string | null
          degree?: string | null
          department?: string | null
          dob?: string | null
          domain?: string | null
          facebook_url?: string | null
          gender?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          instagram_url?: string | null
          interested_domains?: string[] | null
          linkedin_url?: string | null
          other_social_url?: string | null
          permanent_address?: string | null
          permanent_city?: string | null
          permanent_country?: string | null
          permanent_state?: string | null
          reddit_url?: string | null
          resume_url?: string | null
          semester?: number | null
          skills?: string[] | null
          slack_url?: string | null
          specialization?: string | null
          state?: string | null
          terms_accepted?: boolean | null
          twitter_url?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
          usn?: string | null
          year_of_study?: number | null
        }
        Update: {
          about_me?: string | null
          accuracy_confirmation?: boolean | null
          address?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          college_id?: string | null
          college_id_url?: string | null
          country?: string | null
          course?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_course?: string | null
          custom_domain?: string | null
          degree?: string | null
          department?: string | null
          dob?: string | null
          domain?: string | null
          facebook_url?: string | null
          gender?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          instagram_url?: string | null
          interested_domains?: string[] | null
          linkedin_url?: string | null
          other_social_url?: string | null
          permanent_address?: string | null
          permanent_city?: string | null
          permanent_country?: string | null
          permanent_state?: string | null
          reddit_url?: string | null
          resume_url?: string | null
          semester?: number | null
          skills?: string[] | null
          slack_url?: string | null
          specialization?: string | null
          state?: string | null
          terms_accepted?: boolean | null
          twitter_url?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          usn?: string | null
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          address: string | null
          contact_person_designation: string | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_person_designation?: string | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      university_user_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          id: string
          name: string
          permissions: Json
          requested_by: string
          role: string
          status: string
          university_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          permissions?: Json
          requested_by: string
          role?: string
          status?: string
          university_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          permissions?: Json
          requested_by?: string
          role?: string
          status?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_user_requests_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      university_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          permissions: Json
          role: string
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          permissions?: Json
          role?: string
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          permissions?: Json
          role?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_users_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          feature_requested: string | null
          id: string
          message: string | null
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          status: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
          user_role: string
          whatsapp_contact: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          feature_requested?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_id: string
          user_name: string
          user_role: string
          whatsapp_contact?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          feature_requested?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string
          user_role?: string
          whatsapp_contact?: string | null
        }
        Relationships: []
      }
      user_custom_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          feature_key: string
          hidden_fields: string[] | null
          id: string
          is_enabled: boolean | null
          settings: Json | null
          updated_at: string
          updated_by: string | null
          user_id: string
          visible_fields: string[] | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          hidden_fields?: string[] | null
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
          visible_fields?: string[] | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          hidden_fields?: string[] | null
          id?: string
          is_enabled?: boolean | null
          settings?: Json | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          visible_fields?: string[] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          plugin_id: string
          request_payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean
          webhook_url: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          plugin_id: string
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_url: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          plugin_id?: string
          request_payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "company"
        | "student"
        | "admin"
        | "university"
        | "college_coordinator"
      application_status:
        | "applied"
        | "under_review"
        | "shortlisted"
        | "offer_released"
        | "rejected"
        | "withdrawn"
        | "offer_accepted"
      internship_type: "free" | "paid" | "stipended"
      work_mode: "remote" | "onsite" | "hybrid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "company",
        "student",
        "admin",
        "university",
        "college_coordinator",
      ],
      application_status: [
        "applied",
        "under_review",
        "shortlisted",
        "offer_released",
        "rejected",
        "withdrawn",
        "offer_accepted",
      ],
      internship_type: ["free", "paid", "stipended"],
      work_mode: ["remote", "onsite", "hybrid"],
    },
  },
} as const
