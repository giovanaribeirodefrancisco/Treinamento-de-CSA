export const aulaConteudo = {
  module1: {
    lesson1: `
    <b>Definição e importância da CAA</b>
<br><br>
A American Speech-Language-Hearing Association (ASHA) define CAA como qualquer forma de comunicação além da fala, que seja usada para expressar ideias, fazer pedidos, nomeações, comentários.
<br><br>
A sigla CAA se refere a Comunicação Aumentativa Alternativa
<br><br>
<b>Comunicação Aumentativa:</b> São estratégias que aumentam ou complementam a fala. Incluem o uso de imagens, sinais, ou sistemas de símbolos.
<br><br>
<b>Comunicação Alternativa:</b> Substitui completamente a fala, como o uso de dispositivos de comunicação eletrônicos (ex: tablets, dispositivos com síntese de voz).
`,

    lesson2: `
    <b>Parceiros de comunicação</b>
<br><br>
Conforme Beukelman e Mirenda (2013), os parceiros de comunicação podem ser classificados em diferentes categorias: parceiros familiares (pais, irmãos, cuidadores), parceiros profissionais (professores, terapeutas, assistentes) e parceiros naturais (colegas e pessoas da comunidade). Cada grupo possui características e responsabilidades distintas, sendo necessário que todos compreendam o papel ativo que devem exercer no apoio à comunicação. O parceiro de comunicação ele garante acessibilidade naquele contexto para pessoas com necessidade complexa de comunicação já que as relações pessoais são guiadas pela comunicação.
<br><br>
<br>
`,

    lesson3: `
    <b>Modelagem</b>
    <br><br>
    A modelagem na Comunicação Alternativa e Aumentativa (CAA) refere-se ao processo em que o facilitador, muitas vezes um educador ou terapeuta, demonstra o uso de símbolos, palavras ou dispositivos de CAA de maneira intencional e sistemática, com o objetivo de ensinar ao indivíduo a utilizá-los de forma funcional e contextual. Essa técnica envolve a utilização de exemplos concretos de comunicação, nos quais o facilitador torna visível como um determinado símbolo ou estrutura comunicativa pode ser usado em diferentes situações cotidianas. Dessa forma, a modelagem é um componente essencial na aquisição de habilidades de comunicação, pois permite que o usuário compreenda e internalize as regras de uso da linguagem alternativa ou aumentativa, associando os símbolos a contextos práticos (LIGHT; BEUKELMAN; REICHLE, 2003).
    <br><br>`,

    lesson4: `
    <b>Referências Bibliográficas</b>
    <br><br>
    <ul>
      <li>AMERICAN SPEECH-LANGUAGE-HEARING ASSOCIATION. Position Statement on Augmentative and Alternative Communication (CAA). ASHA, 2013. Disponível em: www.asha.org</li>
      <br>
      <li>BEUKELMAN, David R.; MIRENDA, Pat. Augmentative and Alternative Communication: Supporting Children and Adults with Complex Communication Needs. 4. ed. Baltimore: Brookes Publishing, 2013.</li>
      <br>
      <li>BEUKELMAN, David R.; LIGHT, Janice C. Communication Alternatives and Augmentative Communication Systems. 2. ed. Baltimore: Paul H. Brookes, 2020</li>`
  }
};

// Função auxiliar para obter o conteúdo da aula
export function getAulaConteudo(moduleId: number, lessonId: number): string {
  const moduleName = `module${moduleId}` as keyof typeof aulaConteudo;
  const lessonName = `lesson${lessonId}` as keyof (typeof aulaConteudo)[typeof moduleName];

  if (aulaConteudo[moduleName] && aulaConteudo[moduleName][lessonName]) {
    return aulaConteudo[moduleName][lessonName];
  }

  return 'Conteúdo não encontrado.';
}
