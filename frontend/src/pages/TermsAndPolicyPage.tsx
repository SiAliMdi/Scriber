
const TermsAndPolicyPage = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-8 bg-gray-100 dark:bg-gray-800">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Conditions d'utilisation et Politique de confidentialité
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
                Bienvenue sur Scriber. En utilisant notre plateforme, vous acceptez les conditions suivantes :
            </p>
            <ul className="mt-4 list-disc list-inside text-gray-600 dark:text-gray-400">
                <li>
                    Les données sources proviennent de l'API Judilibre publiée par la Cour de Cassation.
                </li>
                <li>
                    Toute utilisation nuisible ou malveillante des décisions juridiques ou des ensembles de données
                    contre la loi est sous la responsabilité de l'utilisateur.
                </li>
                <li>
                    L'activité des utilisateurs sur la plateforme est enregistrée. Toute utilisation malveillante des
                    modèles d'IA ou des LLMs est sous la responsabilité de l'utilisateur.
                </li>
                <li>
                    Nous nous réservons le droit de suspendre ou de supprimer des comptes en cas de violation des
                    conditions d'utilisation.
                </li>
            </ul>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
                Pour toute question ou préoccupation, veuillez nous contacter à l'adresse suivante : support.scriber@unimes.fr.
            </p>
        </div>
    );
};

export default TermsAndPolicyPage;