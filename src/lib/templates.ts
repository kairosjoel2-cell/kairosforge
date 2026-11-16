// KAIROSFORGE template library — each template seeds a real project prompt.

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  gradient: string;
  emoji: string;
  prompt: string;
}

export const TEMPLATES: Template[] = [
  { id: "supermarket", name: "Supermarket", description: "Product categories, cart, checkout flow.", category: "E-commerce", gradient: "from-red-600 to-rose-800", emoji: "🛒", prompt: "Create a premium supermarket website with product categories, shopping cart and checkout interface. Bold red and black theme, responsive layout." },
  { id: "restaurant", name: "Restaurant", description: "Menu, reservations, photo gallery.", category: "Hospitality", gradient: "from-amber-600 to-orange-800", emoji: "🍽️", prompt: "Create an elegant restaurant website with a full menu, table reservation form and a photo gallery. Warm, sophisticated design." },
  { id: "hotel", name: "Hotel", description: "Rooms, booking, amenities showcase.", category: "Hospitality", gradient: "from-teal-600 to-cyan-800", emoji: "🏨", prompt: "Create a luxury hotel website with room showcases, a booking interface and amenities section. Calm, premium aesthetic." },
  { id: "portfolio", name: "Portfolio", description: "Personal showcase, projects, contact.", category: "Personal", gradient: "from-indigo-600 to-purple-800", emoji: "💼", prompt: "Create a striking personal portfolio website with a hero, project gallery, skills and contact form. Modern and creative." },
  { id: "saas", name: "SaaS Platform", description: "Pricing, features, testimonials, CTA.", category: "Business", gradient: "from-blue-600 to-indigo-800", emoji: "🚀", prompt: "Create a modern SaaS landing page with features, pricing tiers, testimonials and a strong call to action. Clean tech design." },
  { id: "ecommerce", name: "E-commerce Store", description: "Product grid, cart, product pages.", category: "E-commerce", gradient: "from-pink-600 to-fuchsia-800", emoji: "🛍️", prompt: "Create a modern e-commerce store with a product grid, product detail pages, shopping cart and checkout." },
  { id: "church", name: "Church", description: "Sermons, events, giving, ministries.", category: "Community", gradient: "from-purple-600 to-violet-900", emoji: "⛪", prompt: "Create a welcoming church website with service times, sermons, events, ministries and online giving." },
  { id: "business", name: "Business Website", description: "Services, about, team, contact.", category: "Business", gradient: "from-slate-600 to-gray-800", emoji: "🏢", prompt: "Create a professional business website with services, about us, team, testimonials and contact sections." },
  { id: "agency", name: "Digital Agency", description: "Services, case studies, team.", category: "Business", gradient: "from-cyan-600 to-blue-800", emoji: "🎨", prompt: "Create a bold digital agency website with services, case studies, team and a contact form. Edgy creative design." },
  { id: "blog", name: "Personal Blog", description: "Posts, categories, about page.", category: "Personal", gradient: "from-emerald-600 to-green-800", emoji: "📝", prompt: "Create a clean personal blog with a post list, categories, an about page and a newsletter signup." },
  { id: "education", name: "Educational Platform", description: "Courses, lessons, enrollment.", category: "Education", gradient: "from-orange-600 to-red-800", emoji: "🎓", prompt: "Create an educational platform website with course listings, lesson previews, instructor profiles and enrollment." },
  { id: "landing", name: "Landing Page", description: "Single-page, high-conversion CTA.", category: "Marketing", gradient: "from-violet-600 to-purple-800", emoji: "🎯", prompt: "Create a high-converting single-page landing page with a hero, benefits, social proof and a signup CTA." },
];
