"use client";

import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export default function PrivacyPolicyModal() {
  const [open, setOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    // Check if the user has accepted the privacy policy
    const accepted = localStorage.getItem("coincrest_privacy_accepted");
    if (accepted !== "v0.1") {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("coincrest_privacy_accepted", "v0.1");
    setOpen(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      setHasScrolled(true);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-[#07111F]/80 backdrop-blur-md" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-[9999] w-[90vw] max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white shadow-2xl focus:outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between border-b border-[#E3E2D9] px-6 py-4">
            <Dialog.Title className="text-lg font-extrabold text-[#07111F]">
              Privacy Policy
            </Dialog.Title>
            <span className="rounded-md bg-[#EEF4FA] px-2 py-1 text-[10px] font-extrabold text-[#2F78B7]">
              Version Beta 0.1
            </span>
          </div>

          <div 
            className="max-h-[60vh] overflow-y-auto px-6 py-5 text-[13px] leading-6 text-[#55554E]"
            onScroll={handleScroll}
          >
            <h3 className="mb-2 font-extrabold text-[#292923]">1. INTRODUCTION</h3>
            <p className="mb-4">
              Welcome to CoinCrest (“CoinCrest”, “Platform”, “Service”, “we”, “us”, or “our”).
              <br /><br />
              CoinCrest is currently an experimental beta-stage technology platform being developed and operated prior to formal incorporation of a business entity.
              <br /><br />
              This Privacy Policy explains how information may be collected, used, stored, processed, disclosed, and protected when you access or use CoinCrest, including its website, dashboards, paper-trading functionality, market-data tools, artificial-intelligence features, including AHNA and associated AI agents, APIs, alerts, watchlists, analytics and related services.
              <br /><br />
              By using CoinCrest, you acknowledge that you have read this Privacy Policy.
              Where consent is required by applicable law, we will request such consent separately through an appropriate affirmative action.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">2. BETA STATUS</h3>
            <p className="mb-4">
              CoinCrest is presently offered as a beta/testing service. The Platform may contain experimental, incomplete or changing features. Features may be modified, suspended or discontinued during testing.
              <br /><br />
              Beta participation does not create a brokerage, investment-advisory, portfolio-management, fiduciary, banking, custodial or similar financial-services relationship between CoinCrest and the user.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">3. INFORMATION WE MAY COLLECT</h3>
            <p className="mb-4">
              <strong>A. Account Information</strong><br />
              This may include: name or display name; email address; authentication information; account identifiers; account preferences; and account creation and login information. Passwords should be stored using secure cryptographic hashing rather than in readable form.
              <br /><br />
              <strong>B. Technical Information</strong><br />
              We may automatically collect information such as: IP address; browser and device type; operating system; session information; timestamps; application logs; error and crash information; security events; and interactions with Platform functionality.
              <br /><br />
              <strong>C. Trading-Simulation Information</strong><br />
              When using paper trading or analytical features, we may process: simulated positions; simulated orders; simulated portfolio values; watchlists; selected assets; trading preferences; simulated profit and loss; risk parameters; alerts; journal entries; and historical Platform activity. Unless expressly stated otherwise, these are simulation records and do not represent assets held or transactions executed by CoinCrest.
              <br /><br />
              <strong>D. AI Interaction Data</strong><br />
              When you use AHNA or other AI functionality, we may process: prompts; selected assets; questions; AI conversations; market-analysis requests; generated responses; feedback; and information necessary to provide AI functionality. Users should not enter passwords, private keys, seed phrases, payment-card information, government identification numbers or other unnecessary sensitive information into AI prompts.
              <br /><br />
              <strong>E. Market and Third-Party Data</strong><br />
              CoinCrest may obtain market information from third-party data providers, exchanges, APIs and other sources. Such information may include prices, trading volumes, market statistics, news, indicators and other financial-market information.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">4. PURPOSES FOR WHICH INFORMATION IS USED</h3>
            <p className="mb-4">
              We may process information where permitted under applicable law for purposes including:
              creating and maintaining accounts; authenticating users; providing paper-trading functionality; generating AI-assisted analysis; maintaining watchlists and user preferences; calculating simulated portfolio information; providing alerts and notifications; improving Platform functionality; diagnosing technical problems; preventing fraud, abuse and unauthorized access; protecting Platform security; complying with applicable legal obligations; responding to lawful government requests; investigating violations of our Terms; and developing and evaluating Platform features.
              <br /><br />
              We will seek additional consent where applicable law requires consent for a materially different processing purpose.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">5. AI PROCESSING</h3>
            <p className="mb-4">
              CoinCrest may use artificial-intelligence systems, including AHNA and specialized AI agents, to process market information and user requests.
              <br /><br />
              AI-generated output may be inaccurate, incomplete, delayed, outdated or otherwise unsuitable for a user’s circumstances. AI systems may use probabilistic techniques and therefore identical or similar inputs may produce different outputs.
              <br /><br />
              CoinCrest does not represent AI-generated content as guaranteed, infallible or certain. Users remain responsible for independently evaluating information generated through the Platform.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">6. FINANCIAL INFORMATION DISCLAIMER</h3>
            <p className="mb-4">
              During the current beta, CoinCrest is intended to operate primarily as a technology, market-information, analytical and paper-trading platform.
              <br /><br />
              Unless and until expressly stated otherwise following any legally required registrations or authorisations: CoinCrest is not operating as a stockbroker; CoinCrest does not hold customer investment funds; CoinCrest does not hold customer securities or crypto assets; CoinCrest does not execute real-money trades on behalf of users; CoinCrest does not guarantee investment performance; simulated returns do not represent actual investment returns; and Platform outputs should not be interpreted as a guarantee that a particular investment or trading strategy will succeed.
              <br /><br />
              Market analysis, scores, indicators, AI-generated observations and simulated trade information are provided for testing, informational and educational purposes during the beta. Nothing in this Privacy Policy is intended to exempt CoinCrest or its operator from any regulatory requirement that applies as a matter of law.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">7. PAPER TRADING</h3>
            <p className="mb-4">
              Paper trading uses simulated capital and simulated transactions. Values displayed within the paper-trading environment may be based on real or delayed market data, but simulated executions may differ materially from actual market execution.
              <br /><br />
              Paper-trading results may not reflect: liquidity; market impact; latency; slippage; order-book conditions; exchange outages; taxes; actual brokerage charges; or other real-market constraints. Users must therefore not treat simulated performance as evidence of future investment performance.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">8. COOKIES AND SIMILAR TECHNOLOGIES</h3>
            <p className="mb-4">
              CoinCrest may use cookies, local storage, session storage or similar technologies for authentication, security, preferences, analytics and Platform functionality. Where legally required, non-essential cookies or similar technologies will be used only after obtaining appropriate consent.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">9. THIRD-PARTY SERVICE PROVIDERS</h3>
            <p className="mb-4">
              CoinCrest may use third-party providers for services such as: cloud infrastructure; databases; authentication; market data; analytics; cybersecurity; email delivery; artificial intelligence; error monitoring; and other technical infrastructure.
              <br /><br />
              Information may be processed by such providers where reasonably necessary to provide the relevant service. Third-party services may operate under their own terms and privacy practices.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">10. DATA SHARING</h3>
            <p className="mb-4">
              We do not intend to sell users’ personal data as part of the beta business model. Information may nevertheless be disclosed where reasonably necessary: to infrastructure and service providers; to prevent fraud or cybersecurity threats; to investigate misuse; to comply with applicable law; pursuant to valid legal process; to protect users or the Platform; in connection with a future restructuring, incorporation, financing, acquisition or transfer of the Platform, subject to applicable law; or with the user’s consent.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">11. INTERNATIONAL PROCESSING</h3>
            <p className="mb-4">
              Some technology providers used by CoinCrest may process information using infrastructure located outside the user’s country. Where personal data is transferred internationally, CoinCrest will seek to implement measures required by applicable data-protection law.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">12. DATA SECURITY</h3>
            <p className="mb-4">
              CoinCrest intends to implement reasonable technical and organizational safeguards appropriate to the nature of the Platform and information processed. Measures may include: encryption in transit; password hashing; authentication controls; access restrictions; environment-secret protection; monitoring; backups; security logging; vulnerability remediation; and other reasonable security controls.
              <br /><br />
              No Internet-connected system is completely secure. Accordingly, absolute security cannot be guaranteed. Users must protect their own credentials and immediately report suspected unauthorized access.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">13. DATA RETENTION</h3>
            <p className="mb-4">
              We retain personal data only for as long as reasonably necessary for the purposes for which it was collected, including security, fraud prevention, dispute resolution and compliance with applicable legal obligations. Certain security or system records may need to be retained for periods required by applicable cybersecurity or other laws. Where information is no longer required, we may delete or anonymize it, subject to applicable legal requirements.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">14. USER RIGHTS</h3>
            <p className="mb-4">
              Depending on applicable law, users may have rights relating to their personal data, including rights to: request information about processing; access certain personal data; request correction; request deletion or erasure where applicable; withdraw consent where processing depends upon consent; raise a grievance; and exercise other rights provided by applicable law.
              <br /><br />
              Withdrawal of consent does not necessarily affect processing already lawfully undertaken before withdrawal. Some information may need to be retained where required by law, security requirements, fraud-prevention requirements or legitimate dispute-resolution needs.
              <br /><br />
              Requests may be submitted to:<br />
              Email: privacy@coincrest.in
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">15. ACCOUNT DELETION</h3>
            <p className="mb-4">
              Where account deletion functionality is available, users may request deletion of their CoinCrest account. Following a valid request, information associated with the account will be deleted, anonymized or retained only to the extent reasonably necessary or legally required.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">16. CHILDREN</h3>
            <p className="mb-4">
              CoinCrest’s beta is not intended for children. Users must satisfy the minimum age requirements applicable in their jurisdiction. Where legally required, we may restrict access or require appropriate consent before processing personal data relating to minors.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">17. SECURITY INCIDENTS</h3>
            <p className="mb-4">
              If CoinCrest becomes aware of a personal-data or cybersecurity incident, we may investigate, contain and remediate the incident and make notifications to users or competent authorities where required by applicable law.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">18. THIRD-PARTY LINKS</h3>
            <p className="mb-4">
              CoinCrest may contain links to websites, exchanges, news sources, data providers or other third-party services. CoinCrest does not control the privacy practices of independent third parties. Users should review the applicable third party’s privacy terms before providing personal information to it.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">19. FUTURE BROKER INTEGRATIONS</h3>
            <p className="mb-4">
              The beta version may eventually be expanded to support integrations with third-party brokers, exchanges or financial-service providers. Unless expressly introduced as an enabled beta feature, CoinCrest currently does not require users to provide brokerage credentials for real-money trade execution. Any future broker connectivity, API-key processing, account aggregation or real-money functionality may be governed by additional privacy disclosures, security controls, contractual terms and regulatory requirements before deployment.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">20. CHANGES TO THIS POLICY</h3>
            <p className="mb-4">
              Because CoinCrest is under active development, this Privacy Policy may change. Material changes may be communicated through the Platform, website, email or another reasonable method. The effective date at the beginning of this Policy identifies the current version. Where applicable law requires fresh consent for a change in processing, such consent will be requested.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">21. OPERATOR INFORMATION</h3>
            <p className="mb-4">
              CoinCrest is currently a beta-stage project and has not yet been incorporated as a separate company.<br />
              The Platform is presently operated by:<br />
              Trading/Project Name: CoinCrest<br />
              Website: coincrest.in<br />
              Jurisdiction: India<br /><br />
              The description of CoinCrest as a project, platform or brand should not be interpreted as representing that CoinCrest is presently an incorporated company. If the Platform is subsequently transferred to an incorporated entity, users will be informed where required and this Privacy Policy will be updated accordingly.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">22. GRIEVANCES AND CONTACT</h3>
            <p className="mb-4">
              Questions, privacy requests, complaints or security concerns may be sent to:<br />
              CoinCrest Privacy Contact<br />
              Email: privacy@coincrest.in<br />
              Country: India<br /><br />
              We will seek to address valid requests within the periods required by applicable law.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">23. GOVERNING LAW</h3>
            <p className="mb-4">
              This Privacy Policy and processing undertaken through the CoinCrest beta are subject to applicable laws of India and other mandatory laws that may apply based on the circumstances of processing. Nothing in this Policy limits rights or obligations that cannot legally be excluded.
            </p>

            <h3 className="mb-2 mt-6 font-extrabold text-[#292923]">24. BETA ACKNOWLEDGEMENT</h3>
            <p className="mb-4">
              By participating in the CoinCrest beta, users acknowledge that: CoinCrest remains under development; functionality may change; paper trading involves simulated rather than actual funds; AI output can contain errors; market information may be delayed or inaccurate; and users should independently verify information before relying upon it. Participation in the beta does not guarantee continued access to the Platform or any future commercial version of CoinCrest.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-b-2xl bg-[#FAFAF7] px-6 py-4 border-t border-[#E3E2D9]">
            <p className="text-[11px] font-semibold text-[#8A897F] text-center">
              Please scroll to the bottom of the Privacy Policy to accept.
            </p>
            <button
              onClick={handleAccept}
              disabled={!hasScrolled}
              className="w-full rounded-xl bg-[#2F78B7] py-3 text-[13px] font-extrabold text-white transition-all hover:bg-[#245F93] focus:outline-none focus:ring-4 focus:ring-[#2F78B7]/20 disabled:cursor-not-allowed disabled:bg-[#D5D6CC] disabled:text-[#8A897F]"
            >
              I Agree &amp; Continue
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
