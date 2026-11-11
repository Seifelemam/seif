/* ==========================================================================
   CONFIG — the only file with settings. Everything else reads from here.
   ========================================================================== */
window.CONFIG = {
  name: 'Seif Elemam',

  /* Contact details. LinkedIn is the official profile URL; it is used by every
     link on the site (contact section, footer, structured data). */
  email: 'seifelemam9@gmail.com',
  linkedin: 'https://www.linkedin.com/in/seif-elemam/',

  /* Download CV. The button only works if this PDF really exists.
     Put a CV WITHOUT date of birth, phone number or home address here. */
  cvFile: 'assets/cv/Seif_Elemam_CV.pdf',

  /* Contact form.
     provider  'formsubmit'  ->  FormSubmit (formsubmit.co): no account, uses the e-mail address above.
                                 ONE-TIME ACTIVATION: the first message triggers an activation e-mail
                                 to the address above. Click the link in it, then the form is live.
               'formspree'   ->  Formspree (formspree.io): create a form there, copy its URL
                                 (https://formspree.io/f/xxxxxxxx) into `endpoint` below.
     endpoint  leave '' to use the default for the chosen provider.
     See README.md, section "Contact form", for the exact steps. */
  form: {
    provider: 'formsubmit',
    endpoint: '',
    providerName: 'FormSubmit',
    minSeconds: 3,          /* anti-spam: ignore submissions made faster than this */
    cooldownSeconds: 30     /* anti-spam: one message per visitor every N seconds */
  },

  /* Entrance screen */
  entrance: {
    enabled: true,
    oncePerSession: true
  },

  /* Default language: 'en' | 'de' | 'ar' */
  defaultLang: 'en'
};

/* Derived values (do not edit) */
(function () {
  var f = window.CONFIG.form;
  if (!f.endpoint) {
    f.endpoint = f.provider === 'formspree'
      ? ''   /* Formspree needs your own form URL: there is no default */
      : 'https://formsubmit.co/ajax/' + window.CONFIG.email;
  }
})();
