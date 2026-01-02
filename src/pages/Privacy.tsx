import { Layout } from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";

const tocItems = [
  { id: "introduction", label: "Introduction" },
  { id: "definitions", label: "Definitions" },
  { id: "overview", label: "Overview" },
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "our-use-of-your-information", label: "Our Use of Your Information" },
  { id: "how-information-is-collected", label: "How Information is Collected" },
  { id: "external-links", label: "External Links on the Platform" },
  { id: "google-analytics", label: "Google Analytics" },
  { id: "google-adsense", label: "Google AdSense" },
  { id: "your-rights", label: "Your Rights" },
  { id: "children-policy", label: "Our Policy Concerning Children" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "other-information-collectors", label: "Other Information Collectors" },
  { id: "disclosure-of-information", label: "Our Disclosure of Your Information" },
  { id: "external-service-providers", label: "External Service Providers" },
  { id: "law-and-order", label: "Law and Order" },
  { id: "accessing-profile", label: "Accessing, Reviewing and Changing Your Profile" },
  { id: "password-control", label: "Control of Your Password" },
  { id: "security", label: "Security" },
  { id: "severability", label: "Severability" },
  { id: "amendment", label: "Amendment" },
  { id: "no-guarantee", label: "No Guarantee" },
  { id: "automated-decision-making", label: "Automated Decision Making" },
  { id: "consent-withdrawal", label: "Consent Withdrawal, Data Download & Data Removal" },
  { id: "contact-us", label: "Contact Us" },
];

const Privacy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-2">Privacy Policy</h1>
        <p className="text-center text-muted-foreground mb-8">Welcome to Economic Labs</p>
        
        <Separator className="my-8" />

        {/* Table of Contents */}
        <nav className="mb-8 p-6 bg-muted/50 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Separator className="my-8" />

        {/* Introduction Section */}
        <section id="introduction" className="mb-8 scroll-mt-20">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Economic Labs, A Unit of Econfin Exploration Pvt Ltd., and having its registered, Karnataka, India-560102, hereinafter referred to as the "Company" (where such expression shall, unless repugnant to the context thereof, be deemed to include its respective legal heirs, representatives, administrators, permitted successors and assigns). The Company ensures steady commitment to your usage of the Platform and privacy with regard to the protection of your invaluable information. This document contains information about the Website and mobile application, hereinafter referred to as the "Platform".
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            In order to provide You with Our uninterrupted use of services, We may collect and, in some circumstances, disclose information about you with your permission. To ensure better protection of Your privacy, We provide this notice explaining Our information collection and disclosure policies, and the choices You make about the way Your information is collected and used.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This Privacy Policy shall be in compliance with the General Data Protection Regulation (GDPR) in effect from May 25, 2018, and any and all provisions that may read to the contrary shall be deemed to be void and unenforceable as of that date. If you do not agree with the terms and conditions of our Privacy Policy, including in relation to the manner of collection or use of your information, please do not use or access the Site. If you have any questions or concerns regarding this Privacy Policy, you should contact our Customer Support Desk at{" "}
            <a href="mailto:econfinexplorationpvtltd@gmail.com" className="text-primary hover:underline">
              econfinexplorationpvtltd@gmail.com
            </a>
          </p>
        </section>

        <Separator className="my-8" />

        {/* Definitions Section */}
        <section id="definitions" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Definitions</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>"We", "Our", and "Us"</strong> shall mean and refer to the Domain and/or the Company, as the context so requires.</li>
            <li><strong>"You", "Your", "Yourself", "User"</strong> shall mean and refer to natural and legal individuals who use the Platform and who is competent to enter into binding contracts, as per Indian laws.</li>
            <li><strong>"Services"</strong> shall refer to the platform that provides internships to students and other related services.</li>
            <li><strong>"Third Parties"</strong> refer to any Application, Company or individual apart from the User, Vendor and the creator of this Application.</li>
            <li><strong>"Personal Information"</strong> shall mean and refer to any personally identifiable information that We may collect from You such as Name, Email Id, Mobile number, Password, Photo etc.</li>
            <li><strong>"Platform"</strong> refers to the Website and Mobile Application which provides the user with the facility to seek information through Service guides published by the Company.</li>
          </ul>
        </section>

        <Separator className="my-8" />

        {/* Overview Section */}
        <section id="overview" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This privacy statement sets forth our online data collection and usage policies and practices. By using our services, you consent to the policies and practices described in this statement. Your data will be stored and processed on our servers which may be inside or outside India and your usage of the Services constitutes consent to the transfer of your data out of India.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our Services may contain links to other website over which we have no control and we are not responsible for the privacy policies or practices of other websites to which you navigate from our Services. We encourage you to review the privacy policies of these other websites so you can understand how they collect, use and share your information. This privacy statement applies solely to the information we collect on Economic labs and its sub-domains and not to information collected otherwise.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Information We Collect Section */}
        <section id="information-we-collect" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We are committed to respecting Your online privacy. We further recognize Your need for appropriate protection and management of any Personal Information You share with us. We may collect the following information:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>Personal data such as, but not limited to, Name, Email Id, Mobile number, Password, Age, Address, etc.</li>
            <li>Tracking Information such as, but not limited to the IP address of your device and Device ID when connected to the Internet.</li>
            <li>Details of Platform usage for analytics.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This privacy policy also applies to data we collect from users who are not registered as members of this Platform, including, but not limited to, browsing behaviour, pages viewed etc. We only collect and use such information from you that we consider necessary for achieving a seamless, efficient and safe experience, customized to your needs including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>To enable the provision of services opted for by you</li>
            <li>To enable the viewing of content in your interest</li>
            <li>To communicate the necessary account and service related information from time to time</li>
            <li>To allow you to receive quality customer care services and data Collection</li>
            <li>To comply with applicable laws, rules and regulations</li>
          </ul>
        </section>

        <Separator className="my-8" />

        {/* Our Use of Your Information Section */}
        <section id="our-use-of-your-information" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Our Use of Your Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The information provided by you shall be used to provide and improve the service for you and all users.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>For maintaining an internal record.</li>
            <li>For enhancing the Services provided.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Your personal data and Sensitive Personal data may be collected and stored by Us for internal record. We use Your tracking information such as IP addresses, and or Device ID to help identify you and to gather broad demographic information and make further services available to you.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We will not sell, license or trade Your personal information. We will not share your personal information with others unless they are acting under our instructions or we are required to do so by law.
          </p>
        </section>

        <Separator className="my-8" />

        {/* How Information is Collected Section */}
        <section id="how-information-is-collected" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">How Information is Collected</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Before or at the time of collecting personal information, we will identify the purposes for which information is being collected. If the same is not identified to you, you have the right to request the Company to elucidate the purpose of collection of said personal information, pending the fulfilment of which you shall not be mandated to disclose any information whatsoever.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We will collect and use your personal information solely with the objective of fulfilling those purposes specified by us, within the scope of the consent of the individual concerned or as required by law. We will only retain personal information as long as necessary for the fulfilment of those purposes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Personal data should be relevant to the purposes for which it is to be used, and, to the extent necessary for those purposes, should be accurate, complete, and up-to-date.
          </p>
        </section>

        <Separator className="my-8" />

        {/* External Links Section */}
        <section id="external-links" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">External Links on the Platform</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Platform may include advertisements, hyperlinks to other websites, applications, content or resources. We have no control over any websites or resources, which are provided by companies or persons other than Us. You acknowledge and agree that we are not responsible for the availability of any such external sites or resources, and do not endorse any advertising, services/services or other materials on or available from such platform or resources. You acknowledge and agree that We are not liable for any loss or damage which may be incurred by you as a result of the availability of those external sites or resources, or as a result of any reliance placed by you on the completeness, accuracy or existence of any advertising, services or other materials on, or available from, such websites or resources.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Google Analytics Section */}
        <section id="google-analytics" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Google Analytics</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use Google Analytics to help us to understand how you make use of our content and work out how we can make things better. These cookies follow your progress through us, collecting anonymous data on where you have come from, which pages you visit, and how long you spend on the site. This data is then stored by Google to create reports. These cookies do not store your personal data.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The information generated by the cookie about your use of the Website, including your IP address, may be transmitted to and stored by Google on servers in the United States. Google may use this information for the purpose of evaluating your use of the website, compiling reports on website activity for us and providing other services relating to website activity and internet usage. By using this website, you consent to the processing of data about you by Google in the manner and for the purposes set out above.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Google AdSense Section */}
        <section id="google-adsense" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Google AdSense</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Google AdSense is a tool that allows website publishers to deliver advertisements to site visitors in exchange for revenue calculated on a per-click or per-impression basis. To do this, Google uses cookies and tracking technology to deliver ads personalized to a website user/visitor. In this regard the following terms are specified to the Users:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to our website or other websites.</li>
            <li>Google's use of advertising cookies enables us and our partners to serve advertisements to you based on their visit to our Platform and/or other websites on the Internet.</li>
            <li>You may opt-out of personalized advertising by visiting Ads Settings.</li>
            <li>All advertisements of third parties on our Platform are for informative purposes only and neither the Platform nor the Company guarantees or bears liability for the authenticity of the advertisements.</li>
            <li>At no point will the Company permit its Competitors to advertise on the Platform.</li>
            <li>You may visit the links in the advertisements at your own risk or choose to not accept the cookies permitting third parties to display their advertisements.</li>
          </ul>
        </section>

        <Separator className="my-8" />

        {/* Your Rights Section */}
        <section id="your-rights" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Unless subject to an exemption, you have the following rights with respect to your personal data:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
            <li>The right to request a copy of your personal data which we hold about you</li>
            <li>The right to request for any correction to any personal data if it is found to be inaccurate or out of date</li>
            <li>The right to withdraw Your consent to the processing at any time</li>
            <li>The right to object to the processing of personal data</li>
            <li>The right to lodge a complaint with a supervisory authority</li>
            <li>The right to obtain information as to whether personal data are transferred to a third country or to an international organization</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Where you hold an account with any of our services, you are entitled to a copy of all personal data which we hold in relation to you. You are also entitled to request that we restrict how we use your data in your account when you log in.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Our Policy Concerning Children Section */}
        <section id="children-policy" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Our Policy Concerning Children</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our Platform is not intended for children under 18 years of age. If you are less than 18 years old at the time of your first visit to our Platform, you are prohibited from using the website further entirely on your own. You may do so under parental guidance. However, please note that we have no way of determining your age when you visit our website or whether you have parental supervision available or not. We do not intend to and do not knowingly collect personal information from children under 18.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Confidentiality Section */}
        <section id="confidentiality" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Confidentiality</h2>
          <p className="text-muted-foreground leading-relaxed">
            You further acknowledge that the Platform may contain information which is designated confidential by us and that you shall not disclose such information without our prior written consent. Your information is regarded as confidential and therefore will not be divulged to any third party, unless if legally required to do so to the appropriate authorities. We will not sell, share, or rent your personal information to any third party or use your e-mail address for unsolicited mail. Any emails sent by us will only be in connection with the provision of agreed services, and you retain sole discretion to seek for discontinuation of such communications at any point of time.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Other Information Collectors Section */}
        <section id="other-information-collectors" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Other Information Collectors</h2>
          <p className="text-muted-foreground leading-relaxed">
            Except as otherwise expressly included in this Privacy Policy, this document only addresses the use and disclosure of information we collect from you. To the extent that you disclose your information to other parties, whether they are on our Platform or on other sites throughout the Internet, different rules may apply to their use or disclosure of the information you disclose to them. Since we do not control the privacy policies of the third parties, you are subject to ask questions before you disclose your personal information to others.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Our Disclosure of Your Information Section */}
        <section id="disclosure-of-information" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Our Disclosure of Your Information</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We may host surveys for survey creators for our platform who are the owners and users of your survey responses. We do not own or sell your responses. Anything you expressly disclose in your responses will be disclosed to survey creators. Please contact the survey creator directly to better understand how they might share your survey responses.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Information collected will not be considered as sensitive if it is freely available and accessible in the public domain or is furnished under the Right to Information Act, 2005, any rules made thereunder or any other law for the time being in force.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            As a matter of policy, we do not sell or rent any personally identifiable information about you to any third party. However, we may be forced to disclose information to the government, law enforcement agencies or third parties under certain circumstances.
          </p>
        </section>

        <Separator className="my-8" />

        {/* External Service Providers Section */}
        <section id="external-service-providers" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">External Service Providers</h2>
          <p className="text-muted-foreground leading-relaxed">
            There may be a number of services offered by external service providers that help you use our Platform. If you choose to use these optional services, and in the course of doing so, disclose information to the external service providers, and/or grant them permission to collect information about you, then their use of your information is governed by their privacy policy.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Law and Order Section */}
        <section id="law-and-order" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Law and Order</h2>
          <p className="text-muted-foreground leading-relaxed">
            We cooperate with law enforcement inquiries, as well as other third parties to enforce laws, such as intellectual property rights, fraud and other rights. We can (and you authorize us to) disclose any information about you to law enforcement and other government officials as we, in our sole discretion, believe necessary or appropriate, in connection with an investigation of fraud, intellectual property infringements, or other activity that is illegal or may expose us or you to legal liability.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Accessing, Reviewing and Changing Your Profile Section */}
        <section id="accessing-profile" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Accessing, Reviewing and Changing Your Profile</h2>
          <p className="text-muted-foreground leading-relaxed">
            Following registration, you can review and change the information you submitted at the stage of registration, except Email ID and mobile number. An option for facilitating such change shall be present on the Platform and such change shall be facilitated by the User. If you change any information, we may or may not keep track of your old information. We will not retain in our files information you have requested to remove for certain circumstances, such as to resolve disputes, troubleshoot problems and enforce our terms and conditions.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Control of Your Password Section */}
        <section id="password-control" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Control of Your Password</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are entirely responsible for maintaining the confidentiality of your password. It is important that you protect it against unauthorized access of your account and information by choosing your password carefully and keeping your password and computer secure by signing out after using our services. You agree not to use the account, username, email address or password of another Member at any time or to disclose your password to any third party. You are responsible for all actions taken with your login information and password, including fees. If your password has been compromised for any reason, you should immediately change your password.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Security Section */}
        <section id="security" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We treat data as an asset that must be protected against loss and unauthorized access. We employ many different security techniques to protect such data from unauthorized access by members inside and outside the Company. We follow generally accepted industry standards to protect the Personal Information submitted to us and information that we have accessed. However, as effective as encryption technology is, no security system is impenetrable. Our Company cannot guarantee the security of our database, nor can we guarantee that information you provide won't be intercepted while being transmitted to the Company over the Internet.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Severability Section */}
        <section id="severability" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Severability</h2>
          <p className="text-muted-foreground leading-relaxed">
            Each paragraph of this Privacy Policy shall be and remain separate from and independent of and severable from all and any other paragraphs herein except where otherwise expressly indicated or indicated by the context of the agreement. The decision or declaration that one or more of the paragraphs are null and void shall have no effect on the remaining paragraphs of this privacy policy.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Amendment Section */}
        <section id="amendment" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Amendment</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our Privacy Policy may change from time to time. The most current version of the policy will govern our use of your information and will always be at the Platform. Any amendments to this Policy shall be deemed as accepted by the User on their continued use of the Platform. You are advised to refer to this page to know about our latest Privacy Policy.
          </p>
        </section>

        <Separator className="my-8" />

        {/* No Guarantee Section */}
        <section id="no-guarantee" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">No Guarantee</h2>
          <p className="text-muted-foreground leading-relaxed">
            While this Privacy Policy states our standards for maintenance of data and we will make efforts to meet them, we are not in a position to guarantee these standards. There may be factors beyond our control that may result in disclosure of data. As a consequence, we disclaim any warranties or representations relating to maintenance or nondisclosure of data.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Automated Decision Making Section */}
        <section id="automated-decision-making" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Automated Decision Making</h2>
          <p className="text-muted-foreground leading-relaxed">
            As a responsible Company, we do not use automatic decision-making or profiling.
          </p>
        </section>

        <Separator className="my-8" />

        {/* Consent Withdrawal Section */}
        <section id="consent-withdrawal" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Consent Withdrawal, Data Download & Data Removal Requests</h2>
          <p className="text-muted-foreground leading-relaxed">
            To withdraw your consent, or to request the download or delete your data with us for any or all our services at any time, please email to{" "}
            <a href="mailto:econfinexplorationpvtltd@gmail.com" className="text-primary hover:underline">
              econfinexplorationpvtltd@gmail.com
            </a>
          </p>
        </section>

        <Separator className="my-8" />

        {/* Contact Us Section */}
        <section id="contact-us" className="mb-8 scroll-mt-20">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions or concerns regarding this privacy policy, you should contact us by sending an e-mail to{" "}
            <a href="mailto:econfinexplorationpvtltd@gmail.com" className="text-primary hover:underline">
              econfinexplorationpvtltd@gmail.com
            </a>
            . Information provided on the website may not be 100% accurate and may be provided for promotional purposes of the business.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default Privacy;
