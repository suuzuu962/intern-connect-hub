import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Dangerous file signatures (magic bytes) for common malware/executable formats
const DANGEROUS_SIGNATURES: { name: string; bytes: number[] }[] = [
  { name: 'Windows Executable (EXE/DLL)', bytes: [0x4D, 0x5A] }, // MZ
  { name: 'ELF Binary', bytes: [0x7F, 0x45, 0x4C, 0x46] }, // .ELF
  { name: 'Java Class', bytes: [0xCA, 0xFE, 0xBA, 0xBE] },
  { name: 'Windows Shortcut (LNK)', bytes: [0x4C, 0x00, 0x00, 0x00] },
  { name: 'Windows Batch (COM)', bytes: [0xE9, 0x3B] },
  { name: 'Mach-O Binary', bytes: [0xFE, 0xED, 0xFA, 0xCE] },
  { name: 'Mach-O 64-bit', bytes: [0xFE, 0xED, 0xFA, 0xCF] },
]

// Allowed MIME types per upload context
const ALLOWED_TYPES: Record<string, string[]> = {
  resume: ['application/pdf'],
  document: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  'college-id': ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  logo: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
  cover: ['image/jpeg', 'image/png', 'image/webp'],
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
}

// Max file sizes per context (in bytes)
const MAX_SIZES: Record<string, number> = {
  resume: 5 * 1024 * 1024,      // 5MB
  document: 5 * 1024 * 1024,     // 5MB
  'college-id': 5 * 1024 * 1024, // 5MB
  logo: 2 * 1024 * 1024,         // 2MB
  cover: 5 * 1024 * 1024,        // 5MB
  avatar: 5 * 1024 * 1024,       // 5MB
}

// Suspicious filename patterns
const SUSPICIOUS_PATTERNS = [
  /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.scr$/i,
  /\.pif$/i, /\.vbs$/i, /\.js$/i, /\.wsh$/i, /\.wsf$/i,
  /\.ps1$/i, /\.msi$/i, /\.dll$/i, /\.sys$/i, /\.cpl$/i,
  /\.hta$/i, /\.inf$/i, /\.reg$/i, /\.rgs$/i, /\.lnk$/i,
  /\.php$/i, /\.asp$/i, /\.aspx$/i, /\.sh$/i,
]

function checkMagicBytes(buffer: Uint8Array): string | null {
  for (const sig of DANGEROUS_SIGNATURES) {
    if (sig.bytes.length <= buffer.length) {
      const match = sig.bytes.every((byte, i) => buffer[i] === byte)
      if (match) return sig.name
    }
  }
  return null
}

function checkSuspiciousFilename(filename: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(filename))
}

// Check for embedded scripts in PDFs
function checkPdfForScripts(buffer: Uint8Array): boolean {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, Math.min(buffer.length, 50000)))
  const suspiciousPatterns = [
    '/JavaScript', '/JS ', '/Launch', '/SubmitForm',
    '/OpenAction', '/AA ', '/RichMedia', '/EmbeddedFile',
  ]
  return suspiciousPatterns.some(p => text.includes(p))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    )
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const fileType = formData.get('fileType') as string | null
    const fileName = formData.get('fileName') as string | null

    if (!file || !fileType) {
      return new Response(JSON.stringify({ error: 'Missing file or fileType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results: { passed: boolean; threats: string[] } = { passed: true, threats: [] }
    const originalName = fileName || file.name || 'unknown'

    // 1. Check filename for suspicious extensions
    if (checkSuspiciousFilename(originalName)) {
      results.passed = false
      results.threats.push(`Suspicious file extension: ${originalName}`)
    }

    // 2. Check file size
    const maxSize = MAX_SIZES[fileType] || 5 * 1024 * 1024
    if (file.size > maxSize) {
      results.passed = false
      results.threats.push(`File exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`)
    }

    // 3. Check MIME type
    const allowedTypes = ALLOWED_TYPES[fileType]
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      results.passed = false
      results.threats.push(`Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`)
    }

    // 4. Check magic bytes
    const buffer = new Uint8Array(await file.arrayBuffer())
    const malwareType = checkMagicBytes(buffer)
    if (malwareType) {
      results.passed = false
      results.threats.push(`Dangerous file format detected: ${malwareType}`)
    }

    // 5. For PDFs, check for embedded scripts
    if (file.type === 'application/pdf') {
      if (checkPdfForScripts(buffer)) {
        results.passed = false
        results.threats.push('PDF contains potentially dangerous embedded scripts or actions')
      }
    }

    // 6. MIME type vs magic bytes consistency check
    if (file.type === 'application/pdf' && !(buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)) {
      results.passed = false
      results.threats.push('File claims to be PDF but content does not match')
    }
    if (file.type.startsWith('image/png') && !(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47)) {
      results.passed = false
      results.threats.push('File claims to be PNG but content does not match')
    }
    if ((file.type === 'image/jpeg' || file.type === 'image/jpg') && !(buffer[0] === 0xFF && buffer[1] === 0xD8)) {
      results.passed = false
      results.threats.push('File claims to be JPEG but content does not match')
    }

    console.log(`File scan result for "${originalName}": ${results.passed ? 'CLEAN' : 'BLOCKED'}`, results.threats)

    return new Response(JSON.stringify({
      passed: results.passed,
      threats: results.threats,
      fileName: originalName,
      fileSize: file.size,
      mimeType: file.type,
    }), {
      status: results.passed ? 200 : 422,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Scan error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
