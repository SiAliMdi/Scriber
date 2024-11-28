import { useEffect, useState } from "react";
import BasePage from "./BasePage";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  

const SearchPage = () => {
    const [categoriesDatasets, setCategoriesDatasets] = useState(new Map<string, string[]>());

    useEffect(() => {

    }, []);

    return (
        <div className="flex xl:w-screen h-screen flex-col">
            <BasePage />
            {/* <h1>Search Page 1</h1> */}
      {/*Container of the 2 columns */}
      {<div className="flex p-1 gap-1 h-full"
      >
      {/*1. First column: Search keywords */}
      <div className="flex-1 border-2 p-4 rounded-md border-blue-400 bg-teal-50"
      >
        <DropdownMenu >
  <DropdownMenuTrigger className="border-2 border-blue-400 rounded-full w-48">Choisir une catégorie</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Billing</DropdownMenuItem>
    <DropdownMenuItem>Team</DropdownMenuItem>
    <DropdownMenuItem>Subscription</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

      </div>
        {/*2. Second column: Search results */}
      <div className="flex-1 border-2 p-4 rounded-md border-blue-400 bg-teal-50"
      >
      
      </div>

      </div>}
      
        </div>
    );
};

export default SearchPage;