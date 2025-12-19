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
          internship_duration: string | null
          internship_mode: string | null
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
          internship_duration?: string | null
          internship_mode?: string | null
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
          internship_duration?: string | null
          internship_mode?: string | null
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
      internship_diary: {
        Row: {
          application_id: string
          content: string
          created_at: string
          entry_date: string
          hours_worked: number | null
          id: string
          skills_learned: string[] | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          application_id: string
          content: string
          created_at?: string
          entry_date: string
          hours_worked?: number | null
          id?: string
          skills_learned?: string[] | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          entry_date?: string
          hours_worked?: number | null
          id?: string
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
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
          title?: string
          type?: string
          user_id?: string
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
      students: {
        Row: {
          accuracy_confirmation: boolean | null
          address: string | null
          bio: string | null
          city: string | null
          college: string | null
          country: string | null
          created_at: string
          degree: string | null
          department: string | null
          dob: string | null
          gender: string | null
          github_url: string | null
          graduation_year: number | null
          id: string
          interested_domains: string[] | null
          linkedin_url: string | null
          resume_url: string | null
          semester: number | null
          skills: string[] | null
          state: string | null
          terms_accepted: boolean | null
          university: string | null
          updated_at: string
          user_id: string
          usn: string | null
        }
        Insert: {
          accuracy_confirmation?: boolean | null
          address?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          degree?: string | null
          department?: string | null
          dob?: string | null
          gender?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          interested_domains?: string[] | null
          linkedin_url?: string | null
          resume_url?: string | null
          semester?: number | null
          skills?: string[] | null
          state?: string | null
          terms_accepted?: boolean | null
          university?: string | null
          updated_at?: string
          user_id: string
          usn?: string | null
        }
        Update: {
          accuracy_confirmation?: boolean | null
          address?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          country?: string | null
          created_at?: string
          degree?: string | null
          department?: string | null
          dob?: string | null
          gender?: string | null
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          interested_domains?: string[] | null
          linkedin_url?: string | null
          resume_url?: string | null
          semester?: number | null
          skills?: string[] | null
          state?: string | null
          terms_accepted?: boolean | null
          university?: string | null
          updated_at?: string
          user_id?: string
          usn?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "company" | "student" | "admin"
      application_status: "pending" | "approved" | "rejected" | "withdrawn"
      internship_type: "full_time" | "part_time" | "contract"
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
      app_role: ["company", "student", "admin"],
      application_status: ["pending", "approved", "rejected", "withdrawn"],
      internship_type: ["full_time", "part_time", "contract"],
      work_mode: ["remote", "onsite", "hybrid"],
    },
  },
} as const
