import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserMatchCardProps {
  match: any;
  onAction: (matchId: number, action: 'like' | 'pass') => void;
  isUpdating: boolean;
}

export default function UserMatchCard({ match, onAction, isUpdating }: UserMatchCardProps) {
  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-400/20 bg-green-400/10';
    if (score >= 60) return 'text-cosmic-gold border-cosmic-gold/20 bg-cosmic-gold/10';
    if (score >= 40) return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
    return 'text-red-400 border-red-400/20 bg-red-400/10';
  };

  const getMatchQuality = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Poor';
  };

  const profile = match.matchData?.profile;
  const compatibilityDetails = match.matchData?.compatibilityDetails;
  const score = parseFloat(match.compatibilityScore);

  return (
    <Card className="bg-cosmic-midnight/40 border-cosmic-purple/20 hover:border-cosmic-gold/40 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-cosmic-gradient rounded-full flex items-center justify-center">
              <i className="fas fa-user text-cosmic-gold"></i>
            </div>
            <div>
              <h3 className="font-semibold text-stellar-white">
                {profile?.displayName || 'Anonymous User'}
              </h3>
              <p className="text-sm text-nebula-gray">
                Cosmic Connection
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${getCompatibilityColor(score).split(' ')[0]}`}>
              {score.toFixed(0)}%
            </div>
            <div className="text-xs text-nebula-gray">
              {getMatchQuality(score)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-nebula-gray line-clamp-3">
            {profile.bio}
          </p>
        )}

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-stellar-white">Interests</p>
            <div className="flex flex-wrap gap-1">
              {profile.interests.slice(0, 3).map((interest: string, index: number) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="text-xs bg-cosmic-purple/20 text-celestial-blue border-cosmic-purple/20"
                >
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 3 && (
                <Badge 
                  variant="secondary"
                  className="text-xs bg-cosmic-purple/20 text-nebula-gray border-cosmic-purple/20"
                >
                  +{profile.interests.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Astrology Tags */}
        {profile?.astrologyTags && profile.astrologyTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-stellar-white">Astrology</p>
            <div className="flex flex-wrap gap-1">
              {profile.astrologyTags.slice(0, 3).map((tag: string, index: number) => (
                <Badge 
                  key={index}
                  variant="outline"
                  className="text-xs border-cosmic-gold/20 text-cosmic-gold"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Compatibility Details */}
        {compatibilityDetails && (
          <div className="bg-cosmic-midnight/60 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-cosmic-gold">Compatibility Breakdown</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-nebula-gray">Planetary: </span>
                <span className="text-stellar-white">{compatibilityDetails.planetaryHarmony || 0}</span>
              </div>
              <div>
                <span className="text-nebula-gray">Houses: </span>
                <span className="text-stellar-white">{compatibilityDetails.houseCompatibility || 0}</span>
              </div>
              <div>
                <span className="text-nebula-gray">KP Signs: </span>
                <span className="text-stellar-white">{compatibilityDetails.kpSignificators || 0}</span>
              </div>
              <div>
                <span className="text-nebula-gray">Overall: </span>
                <span className={getCompatibilityColor(score).split(' ')[0]}>
                  {compatibilityDetails.overallMatch || getMatchQuality(score)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={match.status === 'pending' ? 'secondary' : 
                   match.status === 'liked' ? 'default' : 
                   match.status === 'mutual' ? 'default' : 'outline'}
            className={
              match.status === 'pending' ? 'bg-nebula-gray/20 text-nebula-gray' :
              match.status === 'liked' ? 'bg-cosmic-gold/20 text-cosmic-gold border-cosmic-gold/20' :
              match.status === 'mutual' ? 'bg-green-400/20 text-green-400 border-green-400/20' :
              'border-red-400/20 text-red-400'
            }
          >
            {match.status === 'pending' && <i className="fas fa-clock mr-1"></i>}
            {match.status === 'liked' && <i className="fas fa-heart mr-1"></i>}
            {match.status === 'mutual' && <i className="fas fa-handshake mr-1"></i>}
            {match.status === 'passed' && <i className="fas fa-times mr-1"></i>}
            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
          </Badge>
        </div>

        {/* Action Buttons */}
        {match.status === 'pending' && (
          <div className="flex space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-red-400/20 text-red-400 hover:bg-red-400/10"
              onClick={() => onAction(match.id, 'pass')}
              disabled={isUpdating}
            >
              <i className="fas fa-times mr-1"></i>
              Pass
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-cosmic-gold text-cosmic-midnight hover:bg-cosmic-gold/90"
              onClick={() => onAction(match.id, 'like')}
              disabled={isUpdating}
            >
              <i className="fas fa-heart mr-1"></i>
              Like
            </Button>
          </div>
        )}

        {/* View Details Button for Liked/Mutual */}
        {(match.status === 'liked' || match.status === 'mutual') && (
          <Button
            size="sm"
            variant="outline"
            className="w-full border-cosmic-gold/20 text-cosmic-gold hover:bg-cosmic-gold/10"
          >
            <i className="fas fa-eye mr-2"></i>
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
