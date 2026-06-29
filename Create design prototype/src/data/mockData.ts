export const mockData = {
  en: {
    global: {
      contact: {
        phone: "+962 6 500 1234",
        phoneLink: "tel:+96265001234",
        whatsapp: "+962 79 001 234",
        whatsappLink: "https://wa.me/96279001234",
        email: "info@alshifa-clinic.jo",
        emailLink: "mailto:info@alshifa-clinic.jo",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com"
      },
      clinicName: "Al-Shifa Clinic",
      clinicNameAr: "عيادة الشفاء",
      foundedYear: 2014,
    },
    nav: {
      links: ["Home", "Services", "Doctors", "Insurance", "Contact"],
      bookText: "Book an Appointment",
      whatsappText: "WhatsApp",
      whatsappUsText: "WhatsApp Us",
      callUsText: "Call Us"
    },
    hero: {
      badge: {
        ar: "رعاية صحية متكاملة",
        en: "Comprehensive Healthcare"
      },
      headline: {
        line1: "Your Health,",
        highlight: "Cared for",
        line2: "in Amman."
      },
      description: "Specialized care across 8 medical departments, staffed by board-certified physicians. Serving families across Jordan since 2014.",
      buttons: {
        primary: "Book an Appointment",
        secondary: "WhatsApp Us Now"
      },
      trustBadges: [
        { icon: "Clock", label: "10+ Years of Practice" },
        { icon: "MapPin", label: "3 Clinic Locations" },
        { icon: "ShieldCheck", label: "Insurance Accepted" },
        { icon: "Stethoscope", label: "Open 7 Days" }
      ],
      image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      stats: {
        patients: {
          value: "+8,000",
          label: "Patients Treated"
        },
        reviews: {
          score: "4.9 / 5",
          count: "(320 reviews)",
          label: "Google Reviews"
        }
      }
    },
    socialProof: {
      stats: [
        { icon: "Users", value: "+8,000", label: "Patients Treated" },
        { icon: "UserCheck", value: "+15", label: "Specialist Doctors" },
        { icon: "Building2", value: "3", label: "Clinic Branches\n(Amman · Zarqa · Irbid)" },
        { icon: "ThumbsUp", value: "98%", label: "Patient Satisfaction Rate" }
      ],
      footerText: "Trusted by families across Jordan since 2014 — عائلات تثق بنا عبر الأردن"
    },
    services: {
      badge: "Our Medical Specialties",
      heading: "What We Treat",
      description: "From routine checkups to specialized care — our clinic is equipped to serve your entire family's health needs under one roof.",
      items: [
        {
          icon: "Heart",
          name: "Internal Medicine",
          description: "Comprehensive diagnosis and treatment of adult diseases and chronic conditions."
        },
        {
          icon: "Baby",
          name: "Pediatrics",
          description: "Specialized healthcare for infants, children, and adolescents."
        },
        {
          icon: "Bone",
          name: "Orthopedics",
          description: "Bone, joint, and musculoskeletal disorders treatment and surgery."
        },
        {
          icon: "Flower2",
          name: "Dermatology",
          description: "Skin, hair, and nail conditions treated by certified specialists."
        },
        {
          icon: "Activity",
          name: "OB-GYN",
          description: "Women's health, prenatal care, and gynecological services."
        },
        {
          icon: "Smile",
          name: "Dental Care",
          description: "General and cosmetic dentistry for the whole family."
        },
        {
          icon: "Brain",
          name: "Neurology",
          description: "Diagnosis and treatment of nervous system disorders."
        },
        {
          icon: "Eye",
          name: "Ophthalmology",
          description: "Complete eye care from routine exams to advanced treatments."
        },
        {
          icon: "Pill",
          name: "Endocrinology",
          description: "Hormone disorders, diabetes management, and thyroid care."
        }
      ],
      bookText: "Book for This Department",
      viewAllText: "View All Services"
    },
    doctors: {
      badge: "Our Medical Team",
      heading: "Meet the Doctors",
      description: "Board-certified physicians with international training, dedicated to your health and your family's well-being.",
      list: [
        {
          name: "Dr. Ahmad Al-Rashid",
          title: "MD, Internal Medicine",
          specialty: "Internal Medicine",
          experience: "18 Years Experience",
          education: "University of Jordan · Fellowship – Berlin, Germany",
          languages: "Arabic · English",
          image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        },
        {
          name: "Dr. Rania Khalil",
          title: "MD, Pediatrics",
          specialty: "Pediatrics",
          experience: "12 Years Experience",
          education: "JUST · Fellowship – London, UK",
          languages: "Arabic · English · French",
          image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        },
        {
          name: "Dr. Khaled Mansour",
          title: "MD, Orthopedic Surgery",
          specialty: "Orthopedics",
          experience: "15 Years Experience",
          education: "University of Jordan · Fellowship – Munich, Germany",
          languages: "Arabic · English",
          image: "https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        },
        {
          name: "Dr. Samer Haddad",
          title: "MD, OB-GYN",
          specialty: "Obstetrics & Gynecology",
          experience: "10 Years Experience",
          education: "University of Jordan · Fellowship – Cairo, Egypt",
          languages: "Arabic · English",
          image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        }
      ],
      bookPrefix: "Book with",
      viewAllText: "See Full Team"
    },
    whyChooseUs: {
      badge: "Why Families Choose Us",
      heading: "Why Families in Jordan Trust Us",
      description: "We go beyond treatment — we build lasting trust with every family we serve.",
      reasons: [
        {
          icon: "Clock",
          title: "Extended Hours",
          description: "Open 7 days a week, from early morning to late evening — so we're always available when you need us.",
          color: "text-[#1a6eb5]",
          bg: "bg-[#1a6eb5]/10"
        },
        {
          icon: "Microscope",
          title: "Modern Equipment",
          description: "Digital diagnostics, in-house laboratory, and advanced imaging — all under one roof.",
          color: "text-[#0d9b8d]",
          bg: "bg-[#0d9b8d]/10"
        },
        {
          icon: "CreditCard",
          title: "Insurance Coverage",
          description: "Accepted: Royal Medical Services, UNRWA, Mednet, AXA, Jordan Islamic Insurance & major private insurers.",
          color: "text-purple-600",
          bg: "bg-purple-100"
        },
        {
          icon: "MapPin",
          title: "Accessible Locations",
          description: "Branches in Amman, Zarqa, and Irbid — serving families across the Kingdom.",
          color: "text-rose-500",
          bg: "bg-rose-100"
        },
        {
          icon: "Globe",
          title: "Bilingual Staff",
          description: "Arabic and English speaking doctors and reception team — comfortable for every patient.",
          color: "text-amber-600",
          bg: "bg-amber-100"
        },
        {
          icon: "Timer",
          title: "Short Wait Times",
          description: "Online booking and organized scheduling reduce lobby waiting so you get seen faster.",
          color: "text-[#1a6eb5]",
          bg: "bg-[#1a6eb5]/10"
        }
      ]
    },
    testimonials: {
      badge: "Patient Reviews",
      heading: "What Our Patients Say",
      description: "Real experiences from families who trust us with their health across Jordan.",
      list: [
        {
          name: "Rania M.",
          location: "Abdoun, Amman",
          rating: 5,
          department: "Pediatrics",
          text: "Dr. Rania was incredibly patient with my daughter and explained everything clearly in both Arabic and English. The clinic was clean, organized, and our wait time was very short. We've found our family doctor!"
        },
        {
          name: "Hassan K.",
          location: "Zarqa",
          rating: 5,
          department: "Internal Medicine",
          text: "I've been coming to Al-Shifa for two years now. The staff accepts my RMS insurance without any issues. Dr. Ahmad is thorough, professional, and always takes the time to answer my questions. Highly recommended for government employees."
        },
        {
          name: "Lina T.",
          location: "Sweifieh, Amman",
          rating: 5,
          department: "Dermatology",
          text: "I was nervous about my first appointment but the reception team was so welcoming. They confirmed my insurance within minutes over WhatsApp. The dermatologist solved an issue I had for months in just two visits."
        }
      ],
      googleBadge: {
        rating: "4.9 / 5",
        reviewsText: "320 Google Reviews",
        linkText: "Read More Reviews on Google",
        link: "https://google.com"
      }
    },
    insurance: {
      badge: "Insurance & Payment",
      heading: "We Work With Your Insurance",
      description: "We accept all major insurance plans in Jordan — from government and military to private and international providers.",
      insurers: [
        { name: "Royal Medical Services", abbr: "RMS", color: "#8B0000", note: "Gov & Military" },
        { name: "UNRWA", abbr: "UNRWA", color: "#1E6EB5", note: "UN Agency" },
        { name: "Jordan Islamic Insurance", abbr: "JII", color: "#2E8B57", note: "Islamic Insurance" },
        { name: "Arab Orient Insurance", abbr: "AOI", color: "#FF6600", note: "Private" },
        { name: "Mednet", abbr: "MN", color: "#0057A8", note: "Network" },
        { name: "AXA Insurance", abbr: "AXA", color: "#00008B", note: "International" }
      ],
      cta: {
        heading: "Not sure if your plan is covered?",
        subheading: "Our reception team will confirm your coverage within minutes.",
        buttonText: "Ask About Your Coverage"
      }
    },
    contactForm: {
      badge: "Contact Us",
      heading: "Have a Question? Send Us a Message",
      description: "Our team will respond within a few hours — in Arabic or English.",
      descriptionAr: "سيرد فريقنا خلال ساعات قليلة — باللغة العربية أو الإنجليزية",
      successMessage: {
        heading: "Message Sent!",
        text: "Thank you for reaching out. Our team will get back to you within 2–4 hours during working hours — in Arabic or English.",
        buttonText: "Send Another Message"
      },
      formFields: {
        nameLabel: "Full Name",
        namePlaceholder: "e.g. Ahmad Al-Rashid",
        phoneLabel: "Phone Number",
        emailLabel: "Email Address",
        emailPlaceholder: "you@example.com",
        branchLabel: "Preferred Clinic Branch",
        branchPlaceholder: "Select a branch",
        departmentLabel: "Department / Specialty",
        departmentPlaceholder: "Select department",
        messageLabel: "Message / Question",
        messagePlaceholder: "Tell us how we can help...",
        methodLabel: "Preferred Contact Method",
        methods: {
          phone: "Phone Call",
          whatsapp: "WhatsApp",
          email: "Email"
        },
        submitText: "Send My Inquiry",
        privacyText: "🔒 Your information is private and will never be shared.",
        branches: ["Amman", "Zarqa", "Irbid", "Any Branch"],
        departments: [
          "Internal Medicine",
          "Pediatrics",
          "Orthopedics",
          "Dermatology",
          "OB-GYN",
          "Dental Care",
          "Neurology",
          "Ophthalmology",
          "Endocrinology",
          "Other"
        ]
      },
      sidebar: {
        heading: "Reach Us Directly",
        mainPhoneLabel: "Main Phone",
        whatsappLabel: "WhatsApp",
        emailLabel: "Email",
        responseTimeLabel: "Response Time",
        responseTimeValue: "Within 2–4 hours",
        responseTimeSub: "during working hours",
        whatsappPromo: {
          heading: "Prefer WhatsApp?",
          text: "Message us directly on WhatsApp and we'll respond in minutes.",
          buttonText: "Chat on WhatsApp"
        }
      }
    },
    locations: {
      badge: "Our Locations",
      heading: "Find Your Nearest Branch",
      description: "Three convenient locations across Jordan to serve you and your family.",
      branches: [
        {
          id: "amman",
          label: "Amman Branch",
          address: "Building 42, Al-Madeena St., 2nd Circle",
          addressAr: "شارع المدينة، الدوار الثاني، عمّان",
          landmark: "Opposite Mecca Street, near 2nd Circle Roundabout",
          phone: "+962 6 500 1234",
          hours: [
            { day: "Saturday – Thursday", time: "8:00 AM – 10:00 PM" },
            { day: "Friday", time: "10:00 AM – 6:00 PM" }
          ],
          mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3384.9!2d35.9106!3d31.9539!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjFvMjLigJg!5e0!3m2!1sen!2sjo!4v1"
        },
        {
          id: "zarqa",
          label: "Zarqa Branch",
          address: "Circle 1, Al-Hashmi St., Zarqa",
          addressAr: "شارع الهاشمي، الدوار الأول، الزرقاء",
          landmark: "Near Zarqa City Center Mall",
          phone: "+962 5 380 1234",
          hours: [
            { day: "Saturday – Thursday", time: "9:00 AM – 9:00 PM" },
            { day: "Friday", time: "11:00 AM – 5:00 PM" }
          ],
          mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3383.9!2d36.0879!3d32.0736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjFoOQ!5e0!3m2!1sen!2sjo!4v1"
        },
        {
          id: "irbid",
          label: "Irbid Branch",
          address: "University St., near JUST Gate, Irbid",
          addressAr: "شارع الجامعة، قرب بوابة جامعة العلوم، إربد",
          landmark: "Opposite Jordan University of Science & Technology",
          phone: "+962 2 720 1234",
          hours: [
            { day: "Saturday – Thursday", time: "9:00 AM – 8:00 PM" },
            { day: "Friday", time: "Closed" }
          ],
          mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3374.9!2d35.9792!3d32.5149!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjFt!5e0!3m2!1sen!2sjo!4v1"
        }
      ],
      buttons: {
        directions: "Get Directions",
        whatsapp: "WhatsApp This Branch"
      }
    },
    finalCta: {
      badge: "Ready to take the next step?",
      heading: "Ready to Book Your Appointment?",
      description: "Join thousands of families who trust Al-Shifa Clinic with their health across Amman, Zarqa, and Irbid.",
      buttons: {
        primary: "Book Online Now",
        secondary: "Call Us Directly"
      }
    },
    footer: {
      description: "Comprehensive healthcare for families across Jordan. Caring for you since",
      quickLinksHeading: "Quick Links",
      quickLinks: [
        { label: "Home", href: "#home" },
        { label: "Services", href: "#services" },
        { label: "Doctors", href: "#doctors" },
        { label: "Insurance", href: "#insurance" },
        { label: "Contact", href: "#contact" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Use", href: "#" }
      ],
      branchesHeading: "Our Branches",
      contactHeading: "Contact",
      accreditation: {
        title: "Ministry of Health Accredited",
        regNo: "Reg. No: JMA-2014-4872",
        member: "Jordan Medical Association Member"
      },
      copyright: "Al-Shifa Clinic. All rights reserved.",
      servedAreas: "Serving Amman · Zarqa · Irbid"
    }
  },
  ar: {
    global: {
      contact: {
        phone: "+962 6 500 1234",
        phoneLink: "tel:+96265001234",
        whatsapp: "+962 79 001 234",
        whatsappLink: "https://wa.me/96279001234",
        email: "info@alshifa-clinic.jo",
        emailLink: "mailto:info@alshifa-clinic.jo",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com"
      },
      clinicName: "عيادة الشفاء",
      clinicNameAr: "Al-Shifa Clinic",
      foundedYear: 2014,
    },
    nav: {
      links: ["الرئيسية", "الخدمات", "الأطباء", "التأمين", "اتصل بنا"],
      bookText: "احجز موعداً",
      whatsappText: "واتساب",
      whatsappUsText: "راسلنا على واتساب",
      callUsText: "اتصل بنا"
    },
    hero: {
      badge: {
        ar: "رعاية صحية متكاملة",
        en: "Comprehensive Healthcare"
      },
      headline: {
        line1: "صحتك،",
        highlight: "في أيدٍ أمينة",
        line2: "في عمّان."
      },
      description: "رعاية متخصصة في 8 أقسام طبية، بإشراف أطباء معتمدين. نخدم العائلات في الأردن منذ عام 2014.",
      buttons: {
        primary: "احجز موعداً",
        secondary: "راسلنا على واتساب الآن"
      },
      trustBadges: [
        { icon: "Clock", label: "أكثر من 10 سنوات خبرة" },
        { icon: "MapPin", label: "3 فروع للعيادة" },
        { icon: "ShieldCheck", label: "نقبل التأمين" },
        { icon: "Stethoscope", label: "مفتوح طوال الأسبوع" }
      ],
      image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      stats: {
        patients: {
          value: "+8,000",
          label: "مريض تم علاجه"
        },
        reviews: {
          score: "4.9 / 5",
          count: "(320 تقييم)",
          label: "تقييمات جوجل"
        }
      }
    },
    socialProof: {
      stats: [
        { icon: "Users", value: "+8,000", label: "مريض تم علاجه" },
        { icon: "UserCheck", value: "+15", label: "طبيب مختص" },
        { icon: "Building2", value: "3", label: "فروع للعيادة\n(عمّان · الزرقاء · إربد)" },
        { icon: "ThumbsUp", value: "98%", label: "نسبة رضا المرضى" }
      ],
      footerText: "عائلات تثق بنا عبر الأردن منذ عام 2014 — Trusted by families across Jordan"
    },
    services: {
      badge: "تخصصاتنا الطبية",
      heading: "ما نعالجه",
      description: "من الفحوصات الروتينية إلى الرعاية المتخصصة — عيادتنا مجهزة لتلبية كافة الاحتياجات الصحية لعائلتك تحت سقف واحد.",
      items: [
        {
          icon: "Heart",
          name: "الطب الباطني",
          description: "تشخيص وعلاج شامل لأمراض البالغين والحالات المزمنة."
        },
        {
          icon: "Baby",
          name: "طب الأطفال",
          description: "رعاية صحية متخصصة للرضع والأطفال والمراهقين."
        },
        {
          icon: "Bone",
          name: "جراحة العظام",
          description: "علاج وجراحة العظام والمفاصل والاضطرابات العضلية الهيكلية."
        },
        {
          icon: "Flower2",
          name: "الأمراض الجلدية",
          description: "علاج حالات الجلد والشعر والأظافر بواسطة أخصائيين معتمدين."
        },
        {
          icon: "Activity",
          name: "النسائية والتوليد",
          description: "صحة المرأة، والرعاية ما قبل الولادة، والخدمات النسائية."
        },
        {
          icon: "Smile",
          name: "طب الأسنان",
          description: "طب الأسنان العام والتجميلي لجميع أفراد الأسرة."
        },
        {
          icon: "Brain",
          name: "طب الأعصاب",
          description: "تشخيص وعلاج اضطرابات الجهاز العصبي."
        },
        {
          icon: "Eye",
          name: "طب العيون",
          description: "رعاية شاملة للعيون بدءاً من الفحوصات الروتينية إلى العلاجات المتقدمة."
        },
        {
          icon: "Pill",
          name: "طب الغدد الصماء",
          description: "اضطرابات الهرمونات، وإدارة مرض السكري، ورعاية الغدة الدرقية."
        }
      ],
      bookText: "احجز في هذا القسم",
      viewAllText: "عرض كافة الخدمات"
    },
    doctors: {
      badge: "طاقمنا الطبي",
      heading: "تعرف على أطبائنا",
      description: "أطباء معتمدون بتدريب دولي، مكرسون لصحتك ورفاهية عائلتك.",
      list: [
        {
          name: "د. أحمد الراشد",
          title: "دكتور في الطب الباطني",
          specialty: "الطب الباطني",
          experience: "18 عاماً من الخبرة",
          education: "الجامعة الأردنية · زمالة – برلين، ألمانيا",
          languages: "العربية · الإنجليزية",
          image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        },
        {
          name: "د. رانيا خليل",
          title: "دكتورة في طب الأطفال",
          specialty: "طب الأطفال",
          experience: "12 عاماً من الخبرة",
          education: "جامعة العلوم والتكنولوجيا · زمالة – لندن، المملكة المتحدة",
          languages: "العربية · الإنجليزية · الفرنسية",
          image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        },
        {
          name: "د. خالد منصور",
          title: "دكتور في جراحة العظام",
          specialty: "جراحة العظام",
          experience: "15 عاماً من الخبرة",
          education: "الجامعة الأردنية · زمالة – ميونخ، ألمانيا",
          languages: "العربية · الإنجليزية",
          image: "https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        },
        {
          name: "د. سامر حداد",
          title: "دكتور في النسائية والتوليد",
          specialty: "النسائية والتوليد",
          experience: "10 أعوام من الخبرة",
          education: "الجامعة الأردنية · زمالة – القاهرة، مصر",
          languages: "العربية · الإنجليزية",
          image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
        }
      ],
      bookPrefix: "احجز مع",
      viewAllText: "عرض كامل الفريق"
    },
    whyChooseUs: {
      badge: "لماذا تختارنا العائلات",
      heading: "لماذا تثق بنا العائلات في الأردن",
      description: "نحن نتجاوز مجرد العلاج — نحن نبني ثقة دائمة مع كل عائلة نخدمها.",
      reasons: [
        {
          icon: "Clock",
          title: "ساعات عمل ممتدة",
          description: "نفتح أبوابنا 7 أيام في الأسبوع، من الصباح الباكر حتى وقت متأخر من المساء — لنكون متاحين متى احتجت إلينا.",
          color: "text-[#1a6eb5]",
          bg: "bg-[#1a6eb5]/10"
        },
        {
          icon: "Microscope",
          title: "معدات حديثة",
          description: "تشخيص رقمي، ومختبر داخلي، وتصوير متقدم — كل ذلك تحت سقف واحد.",
          color: "text-[#0d9b8d]",
          bg: "bg-[#0d9b8d]/10"
        },
        {
          icon: "CreditCard",
          title: "تغطية تأمينية",
          description: "نقبل: الخدمات الطبية الملكية، الأونروا، ميدنيت، أكسا، التأمين الإسلامي الأردني وشركات التأمين الخاصة الكبرى.",
          color: "text-purple-600",
          bg: "bg-purple-100"
        },
        {
          icon: "MapPin",
          title: "مواقع يسهل الوصول إليها",
          description: "فروعنا في عمّان، الزرقاء، وإربد — نخدم العائلات في جميع أنحاء المملكة.",
          color: "text-rose-500",
          bg: "bg-rose-100"
        },
        {
          icon: "Globe",
          title: "فريق ثنائي اللغة",
          description: "أطباء وفريق استقبال يتحدثون العربية والإنجليزية — لراحة كل مريض.",
          color: "text-amber-600",
          bg: "bg-amber-100"
        },
        {
          icon: "Timer",
          title: "أوقات انتظار قصيرة",
          description: "الحجز عبر الإنترنت وتنظيم المواعيد يقللان من وقت الانتظار لتلقي الرعاية بشكل أسرع.",
          color: "text-[#1a6eb5]",
          bg: "bg-[#1a6eb5]/10"
        }
      ]
    },
    testimonials: {
      badge: "آراء المرضى",
      heading: "ماذا يقول مرضانا",
      description: "تجارب حقيقية من عائلات تثق بنا في رعايتهم الصحية في جميع أنحاء الأردن.",
      list: [
        {
          name: "رانيا م.",
          location: "عبدون، عمّان",
          rating: 5,
          department: "طب الأطفال",
          text: "كانت الدكتورة رانيا صبورة جداً مع ابنتي وشرحت كل شيء بوضوح باللغتين العربية والإنجليزية. العيادة نظيفة ومنظمة، ووقت الانتظار كان قصيراً جداً. لقد وجدنا طبيب العائلة الخاص بنا!"
        },
        {
          name: "حسن ك.",
          location: "الزرقاء",
          rating: 5,
          department: "الطب الباطني",
          text: "أراجع عيادة الشفاء منذ عامين الآن. يقبل طاقم العمل تأميني من الخدمات الطبية الملكية دون أي مشاكل. الدكتور أحمد دقيق ومحترف، ويأخذ الوقت دائماً للإجابة على أسئلتي. أوصي بهم بشدة للموظفين الحكوميين."
        },
        {
          name: "لينا ت.",
          location: "الصويفية، عمّان",
          rating: 5,
          department: "الأمراض الجلدية",
          text: "كنت متوترة قبل موعدي الأول ولكن فريق الاستقبال كان مرحباً جداً. أكدوا تأميني خلال دقائق عبر واتساب. قام طبيب الأمراض الجلدية بحل مشكلة كنت أعاني منها لأشهر في زيارتين فقط."
        }
      ],
      googleBadge: {
        rating: "4.9 / 5",
        reviewsText: "320 تقييم على جوجل",
        linkText: "اقرأ المزيد من التقييمات على جوجل",
        link: "https://google.com"
      }
    },
    insurance: {
      badge: "التأمين والدفع",
      heading: "نحن نتعامل مع تأمينك",
      description: "نقبل جميع خطط التأمين الكبرى في الأردن — من الحكومية والعسكرية إلى الخاصة والدولية.",
      insurers: [
        { name: "الخدمات الطبية الملكية", abbr: "RMS", color: "#8B0000", note: "حكومي وعسكري" },
        { name: "الأونروا", abbr: "UNRWA", color: "#1E6EB5", note: "وكالة أممية" },
        { name: "التأمين الإسلامي الأردني", abbr: "JII", color: "#2E8B57", note: "تأمين إسلامي" },
        { name: "التأمين العربي المشرق", abbr: "AOI", color: "#FF6600", note: "خاص" },
        { name: "ميدنيت", abbr: "MN", color: "#0057A8", note: "شبكة" },
        { name: "تأمين أكسا", abbr: "AXA", color: "#00008B", note: "دولي" }
      ],
      cta: {
        heading: "لست متأكداً إن كانت خطتك مغطاة؟",
        subheading: "سيؤكد فريق الاستقبال لدينا تغطيتك خلال دقائق.",
        buttonText: "اسأل عن تغطيتك"
      }
    },
    contactForm: {
      badge: "اتصل بنا",
      heading: "هل لديك سؤال؟ أرسل لنا رسالة",
      description: "سيرد فريقنا خلال ساعات قليلة — باللغة العربية أو الإنجليزية.",
      descriptionAr: "Our team will respond within a few hours — in Arabic or English.",
      successMessage: {
        heading: "تم إرسال الرسالة!",
        text: "شكراً لتواصلك معنا. سيتواصل فريقنا معك خلال 2-4 ساعات في أوقات العمل — بالعربية أو الإنجليزية.",
        buttonText: "أرسل رسالة أخرى"
      },
      formFields: {
        nameLabel: "الاسم الكامل",
        namePlaceholder: "مثل: أحمد الراشد",
        phoneLabel: "رقم الهاتف",
        emailLabel: "البريد الإلكتروني",
        emailPlaceholder: "you@example.com",
        branchLabel: "الفرع المفضل",
        branchPlaceholder: "اختر فرعاً",
        departmentLabel: "القسم / التخصص",
        departmentPlaceholder: "اختر القسم",
        messageLabel: "الرسالة / السؤال",
        messagePlaceholder: "أخبرنا كيف يمكننا المساعدة...",
        methodLabel: "طريقة التواصل المفضلة",
        methods: {
          phone: "مكالمة هاتفية",
          whatsapp: "واتساب",
          email: "بريد إلكتروني"
        },
        submitText: "أرسل استفساري",
        privacyText: "🔒 معلوماتك خاصة ولن يتم مشاركتها أبداً.",
        branches: ["عمّان", "الزرقاء", "إربد", "أي فرع"],
        departments: [
          "الطب الباطني",
          "طب الأطفال",
          "جراحة العظام",
          "الأمراض الجلدية",
          "النسائية والتوليد",
          "طب الأسنان",
          "طب الأعصاب",
          "طب العيون",
          "طب الغدد الصماء",
          "أخرى"
        ]
      },
      sidebar: {
        heading: "تواصل معنا مباشرة",
        mainPhoneLabel: "الهاتف الرئيسي",
        whatsappLabel: "واتساب",
        emailLabel: "البريد الإلكتروني",
        responseTimeLabel: "وقت الاستجابة",
        responseTimeValue: "خلال 2-4 ساعات",
        responseTimeSub: "خلال أوقات العمل",
        whatsappPromo: {
          heading: "تفضل استخدام واتساب؟",
          text: "راسلنا مباشرة على واتساب وسنرد عليك خلال دقائق.",
          buttonText: "تحدث معنا على واتساب"
        }
      }
    },
    locations: {
      badge: "مواقعنا",
      heading: "ابحث عن أقرب فرع",
      description: "ثلاثة مواقع مناسبة في جميع أنحاء الأردن لخدمتك وخدمة عائلتك.",
      branches: [
        {
          id: "amman",
          label: "فرع عمّان",
          address: "مبنى 42، شارع المدينة، الدوار الثاني",
          addressAr: "Building 42, Al-Madeena St., 2nd Circle",
          landmark: "مقابل شارع مكة، بالقرب من الدوار الثاني",
          phone: "+962 6 500 1234",
          hours: [
            { day: "السبت – الخميس", time: "8:00 صباحاً – 10:00 مساءً" },
            { day: "الجمعة", time: "10:00 صباحاً – 6:00 مساءً" }
          ],
          mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3384.9!2d35.9106!3d31.9539!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjFvMjLigJg!5e0!3m2!1sen!2sjo!4v1"
        },
        {
          id: "zarqa",
          label: "فرع الزرقاء",
          address: "الدوار الأول، شارع الهاشمي، الزرقاء",
          addressAr: "Circle 1, Al-Hashmi St., Zarqa",
          landmark: "بالقرب من مول الزرقاء سيتي سنتر",
          phone: "+962 5 380 1234",
          hours: [
            { day: "السبت – الخميس", time: "9:00 صباحاً – 9:00 مساءً" },
            { day: "الجمعة", time: "11:00 صباحاً – 5:00 مساءً" }
          ],
          mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3383.9!2d36.0879!3d32.0736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjFoOQ!5e0!3m2!1sen!2sjo!4v1"
        },
        {
          id: "irbid",
          label: "فرع إربد",
          address: "شارع الجامعة، قرب بوابة جامعة العلوم، إربد",
          addressAr: "University St., near JUST Gate, Irbid",
          landmark: "مقابل جامعة العلوم والتكنولوجيا الأردنية",
          phone: "+962 2 720 1234",
          hours: [
            { day: "السبت – الخميس", time: "9:00 صباحاً – 8:00 مساءً" },
            { day: "الجمعة", time: "مغلق" }
          ],
          mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3374.9!2d35.9792!3d32.5149!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjFt!5e0!3m2!1sen!2sjo!4v1"
        }
      ],
      buttons: {
        directions: "احصل على الاتجاهات",
        whatsapp: "واتساب هذا الفرع"
      }
    },
    finalCta: {
      badge: "هل أنت مستعد للخطوة التالية؟",
      heading: "هل أنت مستعد لحجز موعدك؟",
      description: "انضم إلى آلاف العائلات التي تثق بعيادة الشفاء في رعايتها الصحية في عمّان، الزرقاء، وإربد.",
      buttons: {
        primary: "احجز عبر الإنترنت الآن",
        secondary: "اتصل بنا مباشرة"
      }
    },
    footer: {
      description: "رعاية صحية شاملة للعائلات في جميع أنحاء الأردن. نعتني بك منذ عام",
      quickLinksHeading: "روابط سريعة",
      quickLinks: [
        { label: "الرئيسية", href: "#home" },
        { label: "الخدمات", href: "#services" },
        { label: "الأطباء", href: "#doctors" },
        { label: "التأمين", href: "#insurance" },
        { label: "اتصل بنا", href: "#contact" },
        { label: "سياسة الخصوصية", href: "#" },
        { label: "شروط الاستخدام", href: "#" }
      ],
      branchesHeading: "فروعنا",
      contactHeading: "اتصل بنا",
      accreditation: {
        title: "معتمدة من وزارة الصحة",
        regNo: "رقم التسجيل: JMA-2014-4872",
        member: "عضو نقابة الأطباء الأردنية"
      },
      copyright: "عيادة الشفاء. جميع الحقوق محفوظة.",
      servedAreas: "نخدم عمّان · الزرقاء · إربد"
    }
  }
};
