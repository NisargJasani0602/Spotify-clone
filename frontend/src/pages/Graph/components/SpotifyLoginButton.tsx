import { Button } from "@/components/ui/button";


const SpotifyLoginButton = () => {

  const loginWithSpotify = () => {
    window.open("http://127.0.0.1:5001/api/spotify/login", "_blank");
  };

  return (
    <Button
      onClick={loginWithSpotify}
      variant="secondary"
      className="w-full text-white border-zinc-200 h-11"
    >
      <img src="/spotify.png" alt="Spotify Logo" className="w-5 h-5" />
      Login with Spotify
    </Button>
  );
};

export default SpotifyLoginButton;

