import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GenreGraph from "./components/GenreGraph";
import ArtistGraph from "./components/ArtistGraph";
import { Network, User } from "lucide-react";
import SpotifyLoginButton from "./components/SpotifyLoginButton";

const GraphTabs = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-900 via-zinc-900 to-black text-zinc-100 p-8">
        <div className="flex items-center justify-between w-full mb-4">
            <h1 className="text-3xl font-bold">Graph Explorer</h1>
            <div className="w-56">
                <SpotifyLoginButton />
            </div>
        </div>


      <Tabs defaultValue="genre" className="space-y-6">

        {/* TAB SELECTOR */}
        <TabsList className="p-1 bg-zinc-800/50">
          <TabsTrigger
            value="genre"
            className="data-[state=active]:bg-zinc-700 flex items-center"
          >
            <Network className="mr-2 size-4" />
            Genre Graph
          </TabsTrigger>

          <TabsTrigger
            value="artist"
            className="data-[state=active]:bg-zinc-700 flex items-center"
          >
            <User className="mr-2 size-4" />
            Artist Graph
          </TabsTrigger>
        </TabsList>

        {/* ----- CONTENT ----- */}
        <TabsContent value="genre">
          <GenreGraph />
        </TabsContent>

        <TabsContent value="artist">
          <ArtistGraph />
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default GraphTabs;
