import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-cosmic-midnight text-stellar-white">
      {/* Header */}
      <header className="relative z-50 bg-cosmic-midnight/95 backdrop-blur-sm border-b border-cosmic-purple/20">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cosmic-gradient rounded-full flex items-center justify-center">
              <i className="fas fa-star text-cosmic-gold"></i>
            </div>
            <span className="text-xl font-display font-semibold">KP Astrology</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-nebula-gray hover:text-stellar-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-nebula-gray hover:text-stellar-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-nebula-gray hover:text-stellar-white transition-colors">Pricing</a>
            <a href="#about" className="text-nebula-gray hover:text-stellar-white transition-colors">About</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-stellar-white hover:text-cosmic-gold"
              onClick={() => window.location.href = "/api/login"}
            >
              Sign In
            </Button>
            <Button 
              className="bg-cosmic-gradient text-stellar-white hover:opacity-90"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-cosmic-gradient overflow-hidden">
        <div className="absolute inset-0 bg-star-field opacity-60"></div>
        <div className="relative z-10 container mx-auto px-6 py-20 flex items-center min-h-screen">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Professional
              <span className="text-cosmic-gold"> KP Astrology</span>
              <br />Calculations
            </h1>
            <p className="text-xl md:text-2xl text-nebula-gray mb-8 max-w-2xl mx-auto leading-relaxed">
              Authentic Krishnamurti Paddhati astrology with real astronomical data and KP-Newcomb ayanamsa.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-cosmic-gold text-cosmic-midnight hover:bg-opacity-90 text-lg px-8 py-4"
                onClick={() => window.location.href = "/api/login"}
              >
                <i className="fas fa-chart-line mr-2"></i>
                Generate KP Chart
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-stellar-white/20 text-stellar-white hover:bg-stellar-white/10 text-lg px-8 py-4"
              >
                <i className="fas fa-play mr-2"></i>
                Watch Demo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="bg-cosmic-midnight/40 backdrop-blur-sm border-cosmic-purple/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cosmic-gradient rounded-full flex items-center justify-center mb-4 mx-auto">
                    <i className="fas fa-calculator text-cosmic-gold"></i>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Precise Calculations</h3>
                  <p className="text-nebula-gray text-sm">Advanced KP astrology algorithms for accurate house and planetary positions</p>
                </CardContent>
              </Card>
              
              <Card className="bg-cosmic-midnight/40 backdrop-blur-sm border-cosmic-purple/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cosmic-gradient rounded-full flex items-center justify-center mb-4 mx-auto">
                    <i className="fas fa-heart text-cosmic-gold"></i>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Smart Matching</h3>
                  <p className="text-nebula-gray text-sm">AI-powered compatibility analysis based on astrological patterns</p>
                </CardContent>
              </Card>
              
              <Card className="bg-cosmic-midnight/40 backdrop-blur-sm border-cosmic-purple/20">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-cosmic-gradient rounded-full flex items-center justify-center mb-4 mx-auto">
                    <i className="fas fa-shield-alt text-cosmic-gold"></i>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Secure & Private</h3>
                  <p className="text-nebula-gray text-sm">Your birth data is encrypted and protected with enterprise-grade security</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-cosmic-midnight">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Powerful Features</h2>
            <p className="text-xl text-nebula-gray max-w-2xl mx-auto">
              Everything you need to explore astrology and find meaningful connections
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-cosmic-gradient rounded-3xl p-8 shadow-2xl">
                <div className="aspect-square bg-cosmic-midnight/40 rounded-2xl p-6 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border-2 border-cosmic-gold/30 rounded-full"></div>
                    <div className="absolute inset-4 border border-celestial-blue/30 rounded-full"></div>
                    <div className="absolute inset-8 border border-cosmic-purple/30 rounded-full"></div>
                    
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-cosmic-gold rounded-full"></div>
                    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 w-3 h-3 bg-celestial-blue rounded-full"></div>
                    <div className="absolute bottom-6 left-6 w-3 h-3 bg-cosmic-purple rounded-full"></div>
                    <div className="absolute top-8 right-8 w-2 h-2 bg-stellar-white rounded-full"></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-px h-full bg-cosmic-gold/20"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-cosmic-gold/20"></div>
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-cosmic-gold font-display text-xs">
                        <i className="fas fa-star"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl font-display font-bold mb-6">Advanced Chart Generation</h3>
              <p className="text-nebula-gray text-lg mb-6">
                Generate precise KP astrology charts with accurate house divisions, planetary positions, and sub-lord calculations. Our advanced algorithms ensure the highest accuracy in astrological computations.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-cosmic-gold mr-3"></i>
                  <span>Precise house and sub-lord calculations</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-cosmic-gold mr-3"></i>
                  <span>Real-time planetary position tracking</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-cosmic-gold mr-3"></i>
                  <span>Customizable chart styles and formats</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check-circle text-cosmic-gold mr-3"></i>
                  <span>Historical chart recreation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-cosmic-gradient">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">How It Works</h2>
            <p className="text-xl text-nebula-gray max-w-2xl mx-auto">
              Three simple steps to unlock your cosmic potential
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-cosmic-midnight/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-cosmic-gold/20">
                <span className="text-2xl font-display font-bold text-cosmic-gold">1</span>
              </div>
              <h3 className="text-xl font-display font-semibold mb-4">Enter Birth Details</h3>
              <p className="text-nebula-gray">
                Provide your birth date, time, and location for precise astrological calculations
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-cosmic-midnight/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-cosmic-gold/20">
                <span className="text-2xl font-display font-bold text-cosmic-gold">2</span>
              </div>
              <h3 className="text-xl font-display font-semibold mb-4">Generate Your Chart</h3>
              <p className="text-nebula-gray">
                Our advanced algorithms create your personalized KP astrology chart with AI insights
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-cosmic-midnight/40 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-cosmic-gold/20">
                <span className="text-2xl font-display font-bold text-cosmic-gold">3</span>
              </div>
              <h3 className="text-xl font-display font-semibold mb-4">Find Your Matches</h3>
              <p className="text-nebula-gray">
                Discover compatible profiles based on astrological harmony and shared cosmic patterns
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-cosmic-midnight">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Ready to Find Your Cosmic Match?</h2>
          <p className="text-xl text-nebula-gray max-w-2xl mx-auto mb-8">
            Join thousands of users who have discovered their perfect connections through the stars
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-cosmic-gold text-cosmic-midnight hover:bg-opacity-90 text-lg px-8 py-4"
              onClick={() => window.location.href = "/api/login"}
            >
              <i className="fas fa-rocket mr-2"></i>
              Start Your Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-stellar-white/20 text-stellar-white hover:bg-stellar-white/10 text-lg px-8 py-4"
            >
              <i className="fas fa-calendar mr-2"></i>
              Book a Demo
            </Button>
          </div>
          
          <div className="mt-12 flex items-center justify-center space-x-8 text-nebula-gray">
            <div className="flex items-center">
              <i className="fas fa-shield-alt mr-2"></i>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-clock mr-2"></i>
              <span>Setup in 5 minutes</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-star mr-2"></i>
              <span>Trusted by 10k+ users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cosmic-midnight border-t border-cosmic-purple/20 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-cosmic-gradient rounded-full flex items-center justify-center">
                  <i className="fas fa-star text-cosmic-gold"></i>
                </div>
                <span className="text-xl font-display font-semibold">KP Astrology</span>
              </div>
              <p className="text-nebula-gray mb-4">
                Connecting souls through the ancient wisdom of astrology and modern AI technology.
              </p>
            </div>
            
            <div>
              <h4 className="font-display font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-nebula-gray">
                <li><a href="#" className="hover:text-stellar-white transition-colors">Chart Generation</a></li>
                <li><a href="#" className="hover:text-stellar-white transition-colors">Compatibility Matching</a></li>
                <li><a href="#" className="hover:text-stellar-white transition-colors">AI Insights</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-nebula-gray">
                <li><a href="#" className="hover:text-stellar-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-stellar-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-stellar-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-nebula-gray">
                <li><a href="#" className="hover:text-stellar-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-stellar-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-stellar-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-cosmic-purple/20 mt-8 pt-8 text-center text-nebula-gray">
            <p>&copy; 2024 KP Astrology. All rights reserved. Made with <i className="fas fa-heart text-cosmic-gold"></i> for the cosmic community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
