import { User, Product, ServiceItem, JobPosting, DonationItem, MapPinItem, Message, NotificationItem } from '../core/types';

export const mockCurrentUser: User = {
  id: 'u1',
  name: 'Kavindi Perera',
  role: 'seller',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
  coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1000',
  bio: 'Artisan craft maker & customized wooden decor specialist. Passionate about empowering disabled entrepreneurs through inclusive trade.',
  disabilityBadge: 'Wheelchair User',
  rating: 4.9,
  reviewsCount: 128,
  location: 'Colombo 07, Sri Lanka',
  totalEarnings: 345000,
  totalOrders: 86,
  verified: true,
};

export const mockProducts: Product[] = [
  {
    id: 'p1',
    title: 'Handcrafted Ergonomic Bamboo Desk Organizer',
    price: 4500,
    originalPrice: 5500,
    category: 'Crafts & Decor',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    gallery: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600'
    ],
    sellerName: 'Kavindi Perera',
    sellerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    disabilityBadge: 'Wheelchair User',
    sellerRating: 4.9,
    reviewsCount: 128,
    distanceKm: 2.4,
    isWishlisted: true,
    description: 'Beautiful eco-friendly desk organizer handcrafted with precision. Designed for easy reachability and decluttering.',
    specifications: {
      'Material': '100% Organic Bamboo',
      'Dimensions': '30cm x 15cm x 12cm',
      'Weight': '650g',
      'Finish': 'Natural Non-Toxic Polish'
    },
    accessibilityFeatures: ['Tactile Marking', 'Easy Grip Edges', 'Wheelchair Delivered'],
    inStock: true
  },
  {
    id: 'p2',
    title: 'Braille & High-Contrast Customized Wall Clock',
    price: 6200,
    originalPrice: 7500,
    category: 'Home Goods',
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&q=80&w=600',
    sellerName: 'Sahan Wickramasinghe',
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    disabilityBadge: 'Visually Impaired',
    sellerRating: 4.8,
    reviewsCount: 94,
    distanceKm: 4.1,
    isWishlisted: false,
    description: 'Designed specifically for persons with low vision or complete visual impairment. Features tactile raised numbers and Braille dots.',
    specifications: {
      'Diameter': '35 cm',
      'Battery': '1x AA Battery included',
      'Contrast': 'High Contrast Yellow on Black'
    },
    accessibilityFeatures: ['Braille Dots', 'Audible Chime Option', 'High Contrast Yellow'],
    inStock: true
  },
  {
    id: 'p3',
    title: 'Organic Herbal Wellness Tea Gift Box (12 Flavors)',
    price: 3800,
    originalPrice: 4200,
    category: 'Food & Organic',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
    sellerName: 'Nipuni Fernando',
    sellerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    disabilityBadge: 'Hearing Impaired',
    sellerRating: 5.0,
    reviewsCount: 210,
    distanceKm: 1.8,
    isWishlisted: true,
    description: 'Sustainably cultivated organic Ceylon herbal teas packaged by hearing-impaired local artisans with sign language guides in every box.',
    specifications: {
      'Content': '60 Tea Pyramids',
      'Flavors': 'Ginger, Lemongrass, Chamomile, Cinnamon & more',
      'Certification': '100% Organic USDA'
    },
    accessibilityFeatures: ['Sign Language QR Video', 'Easy Tear Pouches'],
    inStock: true
  },
  {
    id: 'p4',
    title: 'Custom Adaptive Clothing Magnetic Button Shirt',
    price: 8500,
    category: 'Apparel & Adaptive',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600',
    sellerName: 'Dilan Rathnayake',
    sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    disabilityBadge: 'Mobility Impaired',
    sellerRating: 4.9,
    reviewsCount: 76,
    distanceKm: 5.5,
    isWishlisted: false,
    description: 'Designed for effortless independent dressing using strong hidden magnetic closures instead of traditional small buttons.',
    specifications: {
      'Fabric': '100% Breathable Cotton',
      'Closure': 'Hidden Neodymium Magnets',
      'Fit': 'Adaptive Relaxed Fit'
    },
    accessibilityFeatures: ['Magnetic Fasteners', 'Seamless Back', 'One-Handed Wear'],
    inStock: true
  }
];

export const mockServices: ServiceItem[] = [
  {
    id: 's1',
    title: 'Accessibility UX Audit & Screen Reader Compliance Testing',
    hourlyRate: 7500,
    providerName: 'Kasun De Silva',
    providerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
    disabilityBadge: 'Visually Impaired',
    rating: 5.0,
    reviewsCount: 64,
    category: 'Tech & Accessibility',
    availability: 'Mon - Fri (Online)',
    portfolioImages: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600'
    ],
    description: 'Expert Web Content Accessibility Guidelines (WCAG 2.1 AA/AAA) audit conducted using NVDA, JAWS, and VoiceOver screen readers.',
    skills: ['WCAG Audit', 'NVDA Screen Reader', 'A11y Remediation', 'React A11y']
  },
  {
    id: 's2',
    title: 'Sign Language Translation & Video Captioning Services',
    hourlyRate: 5000,
    providerName: 'Rashmi Mendis',
    providerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    disabilityBadge: 'Hearing Impaired',
    rating: 4.9,
    reviewsCount: 88,
    category: 'Translation & Media',
    availability: 'Flexible (Remote)',
    portfolioImages: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600'
    ],
    description: 'Professional Sri Lankan Sign Language (SSL) & International Sign interpretation alongside accurate closed captioning.',
    skills: ['Sign Language', 'Subtitling', 'Video Editing', 'Event Translation']
  }
];

export const mockJobs: JobPosting[] = [
  {
    id: 'j1',
    title: 'Accessibility Software Engineer (Remote)',
    company: 'Virtusa Sri Lanka',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
    salary: 'LKR 250,000 - 380,000 / mo',
    location: 'Colombo (100% Remote Available)',
    accessibilityBadges: ['Screen Reader Friendly Workstation', 'Flexible Working Hours', 'Ergonomic Support Allowance'],
    description: 'We are seeking an engineer passionate about building inclusive software. Work from home with full screen-reader and voice control tooling support.',
    postedDate: '2 days ago',
    applicantCount: 14,
    isSaved: true
  },
  {
    id: 'j2',
    title: 'Digital Marketing & Community Assistant',
    company: 'Enable Lanka Foundation',
    companyLogo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=200',
    salary: 'LKR 120,000 - 160,000 / mo',
    location: 'Kandy / Remote',
    accessibilityBadges: ['Wheelchair Accessible Office', 'Sign Language Interpreter On-Site'],
    description: 'Manage social media channels, create accessible alt-text content, and connect with persons with disabilities across local communities.',
    postedDate: 'Yesterday',
    applicantCount: 22,
    isSaved: false
  }
];

export const mockDonations: DonationItem[] = [
  {
    id: 'd1',
    title: 'Motorized Electric Wheelchair for University Student',
    category: 'Wheelchairs',
    targetAmount: 450000,
    raisedAmount: 320000,
    requesterName: 'Tharindu Jayawardena',
    requesterAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    ngoVerified: true,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    description: 'Tharindu is a 2nd year IT undergraduate at University of Moratuwa needing a motorized wheelchair to commute across campus independently.',
  },
  {
    id: 'd2',
    title: 'Smart Digital Hearing Aids for 5 School Children',
    category: 'Hearing Aids',
    targetAmount: 600000,
    raisedAmount: 480000,
    requesterName: 'Sri Lanka Federation for Deaf',
    requesterAvatar: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=300',
    ngoVerified: true,
    image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=600',
    description: 'Providing noise-canceling programmable digital hearing aids for five young students in rural schools to attend regular classes.',
  }
];

export const mockMapPins: MapPinItem[] = [
  {
    id: 'mp1',
    title: 'Kavindi Crafts Studio',
    type: 'seller',
    address: 'No 45, Flower Road, Colombo 07',
    badge: 'Wheelchair Accessible Entrance & Ramp',
    distance: '2.4 km away',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'mp2',
    title: 'Enable Lanka Foundation Center',
    type: 'ngo',
    address: 'Galle Road, Colombo 03',
    badge: 'Sign Language Staff & Braille Docs',
    distance: '3.8 km away',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'mp3',
    title: 'Virtusa Inclusive Innovation Hub',
    type: 'company',
    address: 'Bambalapitiya, Colombo 04',
    badge: '100% Barrier-Free Campus',
    distance: '5.1 km away',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300'
  }
];

export const mockMessages: Message[] = [
  {
    id: 'm1',
    senderId: 'u2',
    senderName: 'Sahan Wickramasinghe',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    text: 'Ayubowan Kavindi! Is the Bamboo desk organizer available for pickup or delivery?',
    timestamp: '10:14 AM',
    isMine: false,
    status: 'read'
  },
  {
    id: 'm2',
    senderId: 'u1',
    senderName: 'Kavindi Perera',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
    text: 'Hello Sahan! Yes, both island-wide wheelchair-accessible delivery and pickup are available.',
    timestamp: '10:16 AM',
    isMine: true,
    status: 'read'
  },
  {
    id: 'm3',
    senderId: 'u2',
    senderName: 'Sahan Wickramasinghe',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    text: '🎙️ Voice Message (0:24)',
    isVoice: true,
    voiceDuration: '0:24',
    timestamp: '10:18 AM',
    isMine: false,
    status: 'read'
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'order',
    title: 'New Order Received! 🛒',
    description: 'Sahan placed an order for Handcrafted Ergonomic Bamboo Desk Organizer.',
    timestamp: '10 mins ago',
    isRead: false
  },
  {
    id: 'n2',
    type: 'job',
    title: 'Application Shortlisted 🎉',
    description: 'Virtusa has reviewed your Accessibility Software Engineer application.',
    timestamp: '2 hours ago',
    isRead: false
  },
  {
    id: 'n3',
    type: 'donation',
    title: 'Donation Milestone Reached! ❤️',
    description: 'Wheelchair campaign is now 71% funded. LKR 320,000 raised!',
    timestamp: '1 day ago',
    isRead: true
  }
];
