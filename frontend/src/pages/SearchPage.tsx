import { FormEvent, useEffect, useState } from "react";
import BasePage from "./BasePage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchCategories, fetchVilles,  groupedSearch, associerDecisions } from "@/services/SearchServices"
import { Categorie } from "@/@types/categorie";
import { Dataset } from "@/@types/dataset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchParameters, Keyword, SearchResult, Decision } from "@/@types/search"
import { CreateCategory } from "@/components/search-components/CreateCategory";
import CreateDialog from "@/components/datasets-list/CreateDialog";
import { createDataset } from "@/services/DatasetsServices";


const SearchPage = () => {
  const [categoriesDatasets, setCategoriesDatasets] = useState<Map<Categorie, Dataset[]>>(new Map<Categorie, Dataset[]>());
  const [villes, setVilles] = useState<string[]>(["Toutes les villes"]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [searchParameters, setSearchParameters] = useState<SearchParameters>({
    q: "",
    query_by: "j_texte",
    filter_by: "",
    sort_by: "j_date:desc",
    page: 1,
    per_page: 10,
    num_typos: 3,
    prioritize_exact_match: false,
    pre_segmented_query: false,
  });
  const [searchResult, setSearchResult] = useState<SearchResult>({
    hits: [],
    found: 0,
    total: 0,
    page: 0,
    search_time_ms: 0,
  });

  {/*user input data for search */ }
  const [keywords, setKeywords] = useState<Keyword[]>([
    { id: 1, value: "", matchExact: false, exclude: false },
  ]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [selectedJuridictions, setSelectedJuridictions] = useState<string[]>(["ca"]);
  const [selectedVilles, setSelectedVilles] = useState<string[]>(["Toutes les villes"]);
  const [selectedDateDebut, setSelectedDateDebut] = useState<Date>();
  const [selectedDateFin, setSelectedDateFin] = useState<Date>();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["arret"]);
  /** After result user selected data */
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [selectedDecision, setSelectedDecision] = useState<Decision>({
    id: "",
    j_texte: "",
    j_chambre: "",
    j_date: 0,
    j_rg: "",
    j_ville: "",
    j_type: "",
    j_juridiction: "",
    highlight: "",
  });
  const [pageSize, setPageSize] = useState<number>(250);
  const [keywordsValue, setKeywordsValue] = useState<string[]>([]);
  const [createCategorieOpen, setCreateCategorieOpen] = useState<boolean>(false);

  const { toast } = useToast();
  useEffect(() => {
    setKeywordsValue(keywords.map((keyword) => keyword.value));
  }, [keywords]);

  useEffect(() => {
    
    setCategoriesDatasets((prev) => {
      const newMap = new Map(prev);
      datasets.forEach((dataset) => {
        const categoryKey = Array.from(newMap.keys()).find((key) => key.id === dataset.categorieId);
        if (categoryKey) {
          const categoryDatasets = newMap.get(categoryKey) || [];
          newMap.set(categoryKey, [...categoryDatasets, dataset]);
        }
      });
      return newMap;
    }
    );
  }, [datasets])
  

  useEffect(() => {
    fetchCategories(setCategoriesDatasets);
    fetchVilles(setVilles, selectedJuridictions);
    // setSearchParameters({ ...searchParameters, per_page: pageSize });
    // logCollection();
    // search( searchParameters, setSearchResult); 

  }, [selectedJuridictions, searchParameters, categoriesDatasets
    // pageSize
  ]);

  // Handle keywords
  const addKeyword = () => {
    const newKeyword = {
      id: Date.now(),
      value: "",
      matchExact: false,
      exclude: false,
    };
    setKeywords((prev) => [...prev, newKeyword]);
  };

  const removeKeyword = (id: number) => {
    if (keywords.length > 1) {
      setKeywords((prev) => prev.filter((keyword) => keyword.id !== id));
    } else {
      alert("Au moins un mot-clé doit être fourni.");
    }
  };

  // Handle juridictions
  const handleJuridictionChange = (checked: boolean, juridiction: string) => {
    !checked ? setSelectedJuridictions((prev) => [...prev, juridiction]) : setSelectedJuridictions((prev) => prev.filter((value) => value !== juridiction));
  };

  // Handle search
  const handleSearch = () => {

    setSelectedDecision({
      id: "",
      j_texte: "",
      j_chambre: "",
      j_date: 0,
      j_rg: "",
      j_ville: "",
      j_type: "",
      j_juridiction: "",
      highlight: "",
    });

    /** Keywords */
    const q = keywords.map((keyword) => {
      if (!keyword.exclude) {
        return keyword.matchExact ? `"${keyword.value}"` : keyword.value;
      }
      /* else {
        return `-${keyword.value}`;
      } */
    }
    ).join(" ");
    console.log("q: ", q);
    /** Filter exclude keywords */
    // const excludeKeywordsFilter = "j_texte:!=[" + keywords.filter((keyword) => keyword.exclude).map((keyword) => `\`${keyword.value}\``).join(", ") + "]";
    // const excludeKeywordsFilter = "j_texte:!=[" + keywords.filter((keyword) => keyword.exclude).map((keyword) => `"${keyword.value}"`).join(", ") + "]";
    const excludeKeywordsFilter = "j_texte:!=" + keywords.filter((keyword) => keyword.exclude).map((keyword) => `\`${keyword.value}\``).join(", ");
    console.log("excludeKeywordsFilter: ", excludeKeywordsFilter);
    /** Filter juridictions */
    /* let juridictionsFilter = "";
    if (selectedJuridictions.length > 0) {
      juridictionsFilter = `j_juridiction:[${selectedJuridictions.join(",")}]`;
    } */

    /** Filter date */
    const dateDebut = selectedDateDebut ? Math.floor(selectedDateDebut.getTime() / 1000) : 0;
    const dateFin = selectedDateFin ? Math.floor(selectedDateFin.getTime() / 1000) : 0;
    let dateFilter = "";
    if (dateDebut && dateFin) {
      dateFilter = `j_date:[${dateDebut}..${dateFin}]`;
    } else if (dateDebut) {
      dateFilter = `j_date:>=${dateDebut}`;
    } else if (dateFin) {
      dateFilter = `j_date:<=${dateFin}`;
    }

    /** Filter villes */
    let villesFilter = "";
    if (!selectedVilles.includes("Toutes les villes")) {
      villesFilter = `j_ville:[${selectedVilles.join(",")}]`;
    }

    /** Filter types */
    let typesFilter = "";
    if (selectedTypes.length > 0) {
      typesFilter = `j_type:[${selectedTypes.join(",")}]`;
    }

    // const searchFilter = [excludeKeywordsFilter, juridictionsFilter, dateFilter, villesFilter, typesFilter].filter((value) => value !== "").join(" && ");
    const searchFilter = [dateFilter, villesFilter, typesFilter].filter((value) => value !== "").join(" && ");
    console.log("searchFilter: ", searchFilter);

    const searchParameters: SearchParameters = {
      q,
      query_by: "j_texte",
      filter_by: searchFilter,
      // sort_by: "j_date:desc",
      sort_by: "",
      page: 1,
      per_page: pageSize,
      num_typos: 3,
      group_by: "j_rg, j_juridiction, j_ville, j_date, j_chambre, j_type",
      group_limit: 1,
      // prioritize_exact_match: false,
      // pre_segmented_query: false,
    };
    setSearchParameters(searchParameters);
    // search(searchParameters, setSearchResult).then(data => {
    groupedSearch(searchParameters, setSearchResult).then(data => {
      setSearchResult(data);
      console.log((data.hits));
    }
    );
  };

  function toggleDecisionSelection(id: string): void {
    if (selectedDecisions.includes(id)) {
      setSelectedDecisions(selectedDecisions.filter((value) => value !== id));
    } else {
      setSelectedDecisions([...selectedDecisions, id]);
    }
  }

  function handlePageChange(val: string): void {
    let newPage = 1;
    switch (val) {
      case "first":
        newPage = 1;
        break;
      case "prev":
        newPage = searchResult.page - 1 > 0 ? searchResult.page - 1 : 1;
        break;
      case "next":
        newPage = searchResult.page + 1 <= Math.ceil(searchResult.found / searchParameters.per_page) ? searchResult.page + 1 : Math.ceil(searchResult.found / searchParameters.per_page);
        break;
      case "last":
        newPage = Math.ceil(searchResult.found / searchParameters.per_page);
        break;
    }
    const updatedSearchParameters = { ...searchParameters, page: newPage };
    setSearchParameters(updatedSearchParameters);
    // search(updatedSearchParameters, setSearchResult).then(data => {
    groupedSearch(updatedSearchParameters, setSearchResult).then(data => {
      setSearchResult(data);
    }
    );
  }

  function toggleSelectAll(event: FormEvent<HTMLButtonElement>): void {

    if (selectAll) {
      setSelectAll(false);
      setSelectedDecisions([]);
    } else {
      setSelectAll(true);
      setSelectedDecisions(searchResult.hits.map((decision) => decision.id));
    }
  }

  function handleAssocier(event: MouseEvent<HTMLButtonElement, MouseEvent>): void {
    console.log("Associer les décisions: ", selectedDecisions);
    for (let index = 0; index < selectedDatasets.length; index++) {
      const dataset = selectedDatasets[index];

      associerDecisions(dataset, selectedDecisions).then(data => {
        console.log("Associer les décisions: ", data);
        toast({
          title: "Décisions associées",
          duration: 3000,
          description: `Les décisions ont été associées avec succès`,
          className: "text-green-700",
        });

      }
      ).catch((error) => {
        console.error("Error while associating decisions: ", error);
        toast({
          variant: "destructive",
          duration: 3000,
          title: "Erreur d'association",
          description: `Les décisions n'ont pas pu être associées avec le dataset ${dataset}`,
        });
      }
      );
    }
  }
  return (
    <div className="flex xl:w-screen h-screen flex-col">
      <BasePage />
      {/*** Container of the 3 columns ***/}
      {<div className="flex p-1 gap-1 h-dvh"
      >
        {/*1. First column: Search keywords */}
        <div className="flex-1 border-2 p-4 rounded-md border-blue-400 bg-teal-50 overflow-y-auto max-h-[90vh]">
          {/* First line */}
          <div className="flex pt-2 justify-between align-middle">
            <div>
              <DropdownMenu>
                <div className="relative">
                  <DropdownMenuTrigger className="border-2 border-blue-400 rounded-full w-auto px-2">
                    <Label className="font-bold cursor-pointer">
                      Choisir des datasets
                    </Label>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent
                  className="absolute z-50 overflow-y-scroll max-h-64 bg-white border rounded shadow-lg w-48"
                  onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus loss
                >
                  {Array.from(categoriesDatasets.keys()).map((categorie, i) => (
                    <div key={categorie.id}>
                      <div className="flex items-center space-x-2">
                        <DropdownMenuLabel>{`${categorie.serialNumber}-${categorie.nomenclature}-${categorie.code}`}</DropdownMenuLabel>
                      </div>
                      {categoriesDatasets.get(categorie)?.map((dataset, index) => (
                        index != categoriesDatasets.get(categorie)?.length -1 ? (
                        <DropdownMenuItem
                          key={dataset.id}
                          onSelect={(e) => e.preventDefault()} // Prevent default selection behavior
                        >
                          <div
                            className="flex items-center space-x-2 w-full"
                            onClick={(e) => e.stopPropagation()} // Stop event bubbling
                          >
                            <Checkbox
                              id={`dataset-${dataset.id}`}
                              checked={selectedDatasets.includes(dataset.id)}
                              onCheckedChange={(checked) => {
                                setSelectedDatasets(prev => checked
                                  ? [...prev, dataset.id]
                                  : prev.filter(id => id !== dataset.id)
                                );
                              }}
                            />
                            <Label htmlFor={`dataset-${dataset.id}`} className="cursor-pointer">
                              {`${dataset.serialNumber}-${dataset.name}`}
                            </Label>
                          </div>
                        </DropdownMenuItem>
                        ) : (
                          <div key={dataset.id} className="flex items-center space-x-2">
                          <DropdownMenuItem
                          key={dataset.id}
                          onSelect={(e) => e.preventDefault()} // Prevent default selection behavior
                        >
                          <div
                            className="flex items-center space-x-2 w-full"
                            onClick={(e) => e.stopPropagation()} // Stop event bubbling
                          >
                            <Checkbox
                              id={`dataset-${dataset.id}`}
                              checked={selectedDatasets.includes(dataset.id)}
                              onCheckedChange={(checked) => {
                                setSelectedDatasets(prev => checked
                                  ? [...prev, dataset.id]
                                  : prev.filter(id => id !== dataset.id)
                                );
                              }}
                            />
                            <Label htmlFor={`dataset-${dataset.id}`} className="cursor-pointer">
                              {`${dataset.serialNumber}-${dataset.name}`}
                            </Label>
                          </div>
                        </DropdownMenuItem>
                        {/* <Button  className="h-6 w-6 p-0 ml-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 hover:shadow-md transition-all duration-200 text-sm font-semibold flex items-center justify-center"
                                title="Créer un nouveau dataset"
                                onClick={(e) => {
                                  // e.stopPropagation(); 
                                  setCreateDialogOpen(true);
                                }}
                                > +</Button>
                                {
                createDialogOpen && <CreateDialog categoryId={categorie.id} nextSerialNumber={ dataset.serialNumber + 1} 
                createDataset={createDataset} setDatasets={setDatasets} createDialogOpen={createDialogOpen} setCreateDialogOpen={setCreateDialogOpen}
                 />
            } */}
                          </div>
                        )
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>

              <Button variant="secondary" className="flex-1 bg-blue-500 text-white float-right  font-bold"
                onClick={() => setCreateCategorieOpen(true)}>
                Ajouter catégorie
              </Button>
              {createCategorieOpen && <CreateCategory createCategorieOpen={createCategorieOpen} setCreateCategorieOpen={setCreateCategorieOpen}
              />}
            </div>
          </div>
          {/* Second line */}
          <div className="space-y-1 pt-8">
            <Label className="font-bold">Mots-clés de recherche</Label>
            <div>
              {keywords.map((keyword, keywordIdx) => (
                <div key={keyword.id} className="flex items-center gap-4 p-1">
                  <Input
                    placeholder={"Mot-clé " + ++keywordIdx}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md"
                    value={keyword.value}
                    // onChange={(e) => handleInputChange(keyword.id, "value", e.target.value)}
                    onChange={(e) =>
                      setKeywords((prev) =>
                        prev.map((k) =>
                          k.id === keyword.id ? { ...k, value: e.target.value } : k
                        )
                      )
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Checkbox
                    id={"matchExact" + keyword.id}
                    className="w-5 h-5"
                    checked={keyword.matchExact}
                    onClick={() =>
                      setKeywords((prev) =>
                        prev.map((k) =>
                          k.id === keyword.id ? { ...k, matchExact: !keyword.matchExact } : k
                        )
                      )
                    }
                  />
                  <Label htmlFor={"matchExact" + keyword.id} className="cursor-pointer">Match exact</Label>
                  <Button
                    variant="secondary"
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-2xl font-bold"
                    onClick={addKeyword}>
                    +
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-2xl font-bold"
                    onClick={() => removeKeyword(keyword.id)}
                  >
                    -
                  </Button>
                </div>
              ))}
            </div>
          </div>
          {/* Third line */}
          <div className="space-y-4 pt-4">
            <Label className="font-bold">Juridictions</Label>
            <div className="flex gap-4 justify-items-start align-middle">
              <Checkbox id="ca" className="w-5 h-5" defaultChecked={true}
                checked={selectedJuridictions.includes("ca")}
                onClick={(e) =>
                  handleJuridictionChange(selectedJuridictions.includes("ca"), "ca")
                }
              />
              <Label htmlFor="ca" className="cursor-pointer">Cours d'appel</Label>
              <Checkbox id="cc" className="w-5 h-5"
                checked={selectedJuridictions.includes("cc")}
                onClick={(e) =>
                  handleJuridictionChange(selectedJuridictions.includes("cc"), "cc")
                }
              />
              <Label htmlFor="cc" className="cursor-pointer">Cour de cassation</Label>
              <Checkbox id="tj" className="w-5 h-5"
                checked={selectedJuridictions.includes("tj")}
                onClick={(e) =>
                  handleJuridictionChange(selectedJuridictions.includes("tj"), "tj")
                }
              />
              <Label htmlFor="tj" className="cursor-pointer">Tribunaux judiciares</Label>
            </div>
          </div>
          {/* Fourth && Fifth lines */}
          <div className="flex w-full justify-between pt-6">
            <div className="space-y-4" >
              <Label className="font-bold">Villes</Label>

              <div>
                <DropdownMenu>
                  <div className="relative">
                    <DropdownMenuTrigger
                      className="border-2 border-blue-400 rounded-full w-auto px-2"
                    >
                      <Label className="font-bold cursor-pointer">
                        Choisir des villes
                      </Label>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="absolute z-50 overflow-y-scroll max-h-64 bg-white border rounded shadow-lg"
                    >
                      <div>
                        {villes.map((ville, i) => (
                          <div key={"ville-" + i} className="flex items-center space-x-1 mt-1">
                            <Checkbox
                              id={"ville-" + i}
                              className="w-5 h-5"
                              checked={selectedVilles.includes(ville)}
                              onClick={(e) => {
                                selectedVilles.includes(ville)
                                  ? setSelectedVilles(selectedVilles.filter((value) => value !== ville))
                                  : setSelectedVilles([...selectedVilles, ville])
                              }
                              }
                            />
                            <Label htmlFor={"ville-" + i} className="cursor-pointer">{ville}</Label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </div>
                </DropdownMenu>

              </div>
            </div>
            {/* Fifth line */}
            <div>
              <Label className="font-bold">Dates</Label>
              <div className="flex gap-2 mt-2 align-middle justify-normal">
                <div>
                  <Label htmlFor="dateDebut" className="w-32 pt-3">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    className="border-2 border-blue-400 rounded-md w-auto"
                    placeholder="Date de début"
                    onChange={(e) => setSelectedDateDebut(new Date(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="dateFin" className="w-32 pt-3">Date de fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    className="border-2 border-blue-400 rounded-md w-auto"
                    placeholder="Date de fin"
                    onChange={(e) => setSelectedDateFin(new Date(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Sixth line */}
          <div className="pt-6">
            <Label className="font-bold">Types des décisions recherchées</Label>
            <div className="flex gap-8 justify-items-start mt-2">
              {/* Arrêt */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="arret"
                  className="w-5 h-5"
                  checked={selectedTypes.includes("arret")}
                  onClick={(e) =>
                    selectedTypes.includes("arret")
                      ? setSelectedTypes(selectedTypes.filter((value) => value !== "arret"))
                      : setSelectedTypes([...selectedTypes, "arret"])
                  }
                />
                <Label htmlFor="arret" className="cursor-pointer">
                  Arrêt
                </Label>
              </div>
              {/* Ordonnance */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ordonnance"
                  className="w-5 h-5"
                  checked={selectedTypes.includes("ordonnance")}
                  onClick={(e) =>
                    selectedTypes.includes("ordonnance")
                      ? setSelectedTypes(
                        selectedTypes.filter((value) => value !== "ordonnance")
                      )
                      : setSelectedTypes([...selectedTypes, "ordonnance"])
                  }
                />
                <Label htmlFor="ordonnance" className="cursor-pointer">
                  Ordonnance
                </Label>
              </div>
              {/* Autre */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="autre"
                  className="w-5 h-5"
                  checked={selectedTypes.includes("autre")}
                  onClick={(e) =>
                    selectedTypes.includes("autre")
                      ? setSelectedTypes(selectedTypes.filter((value) => value !== "autre"))
                      : setSelectedTypes([...selectedTypes, "autre"])
                  }
                />
                <Label htmlFor="autre" className="cursor-pointer">
                  Autre
                </Label>
              </div>
            </div>
          </div>

          {/* Seventh line */}
          <div className="pt-6">
            <button
              type="submit"
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Rechercher
            </button>
            {isSearching && (
              <div className="flashing-text mt-2 text-blue-500 font-bold">
                ...récherche en cours
              </div>
            )}
          </div>
        </div>

        {/* 2. Second column: Search results */}
        <div className="flex-1 border-2 p-4 rounded-md border-blue-400 bg-teal-50 overflow-y-auto max-h-[90vh]">
          {/* Line 1: Search keywords and filters */}
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold">Mots-clés :</span>
            <span>{keywordsValue.join(", ")}</span>
          </div>

          {/* Line 2: Result metrics */}
          <div className="flex justify-between items-center mb-4">

            <div>
              <strong>Résultats :</strong>
              {` ${searchResult.found} sur ${searchResult.total} décisions`}
            </div>
            <div>
              <strong>Temps recherche : </strong>
              {` ${searchResult.search_time_ms}ms`}</div>
          </div>

          {/* Page controls and selectors */}
          <div className="flex justify-between items-center mb-4">
            {/*
            <div>
              <label htmlFor="page-size-selector" className="mr-2">Taille de page :</label>
              <select
                id="page-size-selector"
                className="border-2 p-1 rounded-md"
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  const updatedSearchParameters = { ...searchParameters, per_page: Number(e.target.value) };  
                  setSearchParameters({ ...searchParameters, per_page: Number(e.target.value) });
                  console.log("searchParameters from page select: ", searchParameters);
                  search(updatedSearchParameters, setSearchResult).then(data => {
                    setSearchResult(data);
                  }
                  );

                }}
                defaultValue={pageSize}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="250">250 (MAX)</option>
              </select>
            </div>
*/}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handlePageChange("first")}
                className="border-2 p-1 rounded-md"
              >
                {"<<"}
              </button>
              <button
                onClick={() => handlePageChange("prev")}
                className="border-2 p-1 rounded-md"
              >
                {"<"}
              </button>
              <span>{searchParameters.page + " / "}{Math.ceil(searchResult.found / searchParameters.per_page)}</span>
              <button
                onClick={() => handlePageChange("next")}
                className="border-2 p-1 rounded-md"
              >
                {">"}
              </button>
              <button
                onClick={() => handlePageChange("last")}
                className="border-2 p-1 rounded-md"
              >
                {">>"}
              </button>
            </div>

            <div>
              <strong>Déc. sélect. : </strong>
              {`${selectedDecisions.length}`}</div>
          </div>

          {/* Checkbox to select/unselect all */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">

              <Checkbox
                id="select-all"
                checked={selectAll}
                onChange={toggleSelectAll}
                onClick={toggleSelectAll}
                className="mr-2 cursor-pointer"
              />
              <Label htmlFor="select-all" className="cursor-pointer">Sélectionner toutes les décisions</Label>
            </div>
            <button
              onClick={handleAssocier}
              className="px-2 py-2 bg-blue-500 text-white rounded"
            >
              Associer les décisions
            </button>
          </div>

          {/* Search results in stacked boxes */}
          <div className="space-y-4">
            {searchResult.hits.map((decision, i) => (
              <div
                key={decision.id}
                className="p-1 border-2 border-blue-400 rounded-md bg-white flex flex-col"
              >
                <div className="flex items-center mb-1 cursor-pointer"
                  onClick={() => { setSelectedDecision(decision) }}
                >
                  <Label className="mr-2 font-bold cursor-pointer" htmlFor={`decision-${decision.id}`}>{i + 1}.</Label>

                  <Checkbox
                    id={`decision-checkbox-${decision.id}`}
                    checked={selectedDecisions.includes(decision.id)}
                    onChange={() => toggleDecisionSelection(decision.id)}
                    onClick={() => toggleDecisionSelection(decision.id)}
                    className="mr-2"
                  />
                  <Label
                    onClick={() => {
                      setSelectedDecision(decision)
                    }}
                    htmlFor={`decision-checkbox-${decision.id}`}
                    className="font-bold cursor-pointer"
                  >{`${decision.j_juridiction}-${decision.j_rg}-${decision.j_ville}-${decision.j_date}`}</Label>
                </div>
                <div
                  className="text-sm cursor-pointer"
                  dangerouslySetInnerHTML={{ __html: decision.highlight }}
                  onClick={() => { setSelectedDecision(decision) }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Third column: Selected decision */}
        <div className="flex-1 border-2 p-4 rounded-md border-blue-400 bg-teal-50 overflow-auto max-h-[90vh]">
          {selectedDecision.j_texte ? (
            <div className="h-full flex flex-col">
              <h3 className="font-bold text-lg mb-4 flex-shrink-0 border-b-2 border-black">
                {`${selectedDecision.j_juridiction}-${selectedDecision.j_rg}-${selectedDecision.j_ville}-${selectedDecision.j_date}`}

              </h3>
              <div
                className="text-sm flex-grow overflow-y-auto whitespace-pre"
                dangerouslySetInnerHTML={{
                  __html: selectedDecision.j_texte.replace(
                    new RegExp(keywordsValue.join("|"), "gi"),
                    (match) => `<span class="bg-yellow-200">${match}</span>`
                  ),
                }}
              ></div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Aucune décision n'a été sélectionnée</p>
          )}
        </div>
      </div>}

    </div>
  );
};

export default SearchPage;