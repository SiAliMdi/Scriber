type Decision = {
    id?: string,
    j_texte: string,
    j_chambre?: string,
    j_date?: string,
    j_rg: string,
    j_ville: string,
    j_type?: string,
    j_juridiction?: string,
}

type fetchedDecision = {
        id?: string;
        j_texte: string;
        j_chambre?: string;
        j_date?: string;
        j_rg: string;
        j_ville: string;
        j_type?: string;
        j_juridiction?: string;
        texte_net?: string;
      };



export type { Decision, fetchedDecision };