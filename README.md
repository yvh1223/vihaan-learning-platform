# Vihaan's 5th Grade Learning Platform

An interactive, AI-powered learning platform for 5th grade students, featuring comprehensive STAAR/MAP test preparation, visual learning elements, and personalized remediation.

## 🚀 Project Status

**Current Phase**: Epic 1 Complete → Epic 2 Ready to Start  
**Next Task**: Core Navigation & Dashboard  
**For Developers/LLMs**: See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for immediate handoff instructions

## Features

🎯 **Texas TEKS Standards Aligned** - 100% curriculum coverage  
🤖 **AI-Powered Remediation** - Personalized questions for wrong answers using GPT-4o-mini  
📊 **STAAR/MAP Test Prep** - Authentic practice questions based on real assessments  
🎨 **Visual Learning** - 1000+ educational images, diagrams, and interactive elements  
🌐 **Multi-Student Support** - Cloud-based progress tracking with admin dashboard  
📱 **Responsive Design** - Works on tablets, phones, and desktops  

## Subjects Covered

### Mathematics
- Numbers & Operations with visual manipulatives
- Algebraic Reasoning with interactive tools  
- Geometry & Measurement with 3D models
- Data Analysis & Financial Literacy

### Science  
- Scientific Investigation with virtual labs
- Matter & Energy simulations
- Forces & Motion interactive elements
- Earth & Space science content
- Life Science & Ecosystems

### English Language Arts
- Reading Comprehension with visual support
- Writing Skills development tools
- Speaking & Listening activities
- Grammar & Vocabulary games

### Social Studies
- American History interactive timeline
- Geography with interactive maps
- Government & Citizenship simulations  
- Economics & Cultural heritage

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: Supabase with Row Level Security
- **AI Integration**: OpenAI GPT-4o-mini for cost-effective remediation
- **Hosting**: GitHub Pages
- **Visual Assets**: WebP optimized images with lazy loading

## Getting Started

### Prerequisites
- Node.js 16+ 
- Git with GPG signing configured
- Supabase account
- OpenAI API key

### Installation
```bash
# Clone the repository
git clone https://github.com/yvh1223/vihaan-learning-platform.git
cd vihaan-learning-platform

# Install dependencies
npm install

# Set up environment variables
cp config/example.env config/.env
# Edit config/.env with your API keys

# Start development server
npm run dev
```

### Configuration
1. Set up Supabase project and configure database schema
2. Add OpenAI API key for AI remediation features  
3. Configure GitHub Pages deployment
4. Set up GitHub Secrets for production deployment

## Project Structure

```
vihaan-learning-platform/
├── index.html                 # Landing page
├── css/                      # Stylesheets
│   ├── main.css             # Main styles
│   ├── subjects/            # Subject-specific styles
│   └── responsive.css       # Mobile responsiveness
├── js/                       # JavaScript modules
│   ├── app.js               # Main application
│   ├── progress.js          # Progress tracking
│   ├── interactive.js       # Interactive elements
│   ├── supabase-config.js   # Database connection
│   └── ai-remediation.js    # AI question generation
├── subjects/                 # Subject modules
│   ├── mathematics/         # Math content
│   ├── science/             # Science content  
│   ├── english/             # ELA content
│   └── social-studies/      # Social Studies content
├── assets/                   # Static assets
│   ├── images/              # Educational images
│   ├── icons/               # UI icons
│   ├── multimedia/          # Videos and animations
│   └── generated/           # AI-generated content
├── data/                     # Data files
│   ├── curriculum.json      # TEKS standards mapping
│   ├── assessment-bank.json # Question database
│   └── ai-prompts.json      # AI prompt templates
└── config/                   # Configuration files
    ├── supabase-config.json # Database configuration
    ├── database-schema.json # Database structure
    └── openai-config.json   # AI API configuration
```

## Development Guidelines

### Commit Message Format
All commits must be signed with GPG and follow conventional format:
```
type: brief description

Longer description if needed.
```

### Code Standards  
- ES6+ JavaScript
- Mobile-first responsive CSS
- Accessible HTML with proper ARIA labels
- WebP images with fallbacks
- < 3 second page load times

### AI Remediation
- GPT-4o-mini model for cost-effectiveness (~$15-60/month for 100 students)
- Questions generated only for wrong answers
- All AI content validated for educational accuracy
- TEKS standards alignment for each generated question

## Deployment

### GitHub Pages
```bash
# Build for production
npm run build

# Deploy to GitHub Pages  
npm run deploy
```

### Environment Setup
Configure these GitHub Secrets:
- `SUPABASE_SERVICE_ROLE_KEY`: For admin functions
- `OPENAI_API_KEY`: For AI remediation
- `DEPLOYMENT_TOKEN`: For automated deployment

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes with GPG signing
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Acknowledgments

- Texas Education Agency for TEKS standards
- Educational content aligned with Coppell ISD curriculum
- OpenAI for cost-effective AI remediation capabilities
- Supabase for scalable database infrastructure

---

**Built with ❤️ for 5th grade learners**