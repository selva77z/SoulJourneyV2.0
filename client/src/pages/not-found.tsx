import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  const currentPath = window.location.pathname;
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cosmic-midnight">
      <Card className="w-full max-w-md mx-4 bg-cosmic-midnight/40 border-cosmic-purple/20">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-cosmic-gold" />
            <h1 className="text-2xl font-bold text-stellar-white">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-nebula-gray">
            The page "{currentPath}" could not be found.
          </p>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-nebula-gray">Available pages:</p>
            <ul className="text-sm text-stellar-white space-y-1">
              <li>• / (Home)</li>
              <li>• /horoscopes (Horoscope Center)</li>
              <li>• /profile (User Profile)</li>
              <li>• /chart (Chart View)</li>
              <li>• /matches (Compatibility Matches)</li>
            </ul>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-cosmic-gold text-cosmic-midnight rounded-lg hover:bg-cosmic-gold/90 transition-colors"
          >
            Go to Home
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
