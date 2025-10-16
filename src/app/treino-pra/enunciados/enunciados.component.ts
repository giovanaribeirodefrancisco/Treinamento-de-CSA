import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-enunciados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enunciados.component.html',
  styleUrl: './enunciados.component.scss'
})
export class EnunciadosComponent implements OnInit, OnChanges {
  @Input() etapa: number = 1;

  ngOnInit() {
    console.log('EnunciadosComponent inicializado com etapa:', this.etapa);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['etapa']) {
      console.log('Etapa mudou de', changes['etapa'].previousValue, 'para', changes['etapa'].currentValue);
      console.log('Enunciado atual:', this.getEnunciadoCompleto(this.etapa));
    }
  }

  getEnunciado(etapa: number): string {
    switch(etapa) {
      case 1: return 'Lição Teste';
      case 2: return 'Etapa 1 - Apresentação';
      case 3: return 'Etapa 2 - Nome com CAA';
      case 4: return 'Etapa 3 - Regras na Sala de Aula';
      case 5: return 'Etapa 4 - Regras na Sala de Aula';
      case 6: return 'Etapa 5 - Regras na Sala de Aula';
      case 7: return 'Etapa 6 - Instruções da Aula';
      case 8: return 'Etapa 7 - Instruções da Aula';
      case 9: return 'Etapa 8 - Interação na Sala de Aula';
      case 10: return 'Etapa 9 - Interação na Sala de Aula';
      case 11: return 'Etapa 10 - Interação na Sala de Aula';
      case 12: return 'Etapa 11 - Interação na Sala de Aula';
      case 13: return 'Etapa 12 - Interação na Sala de Aula';
      case 14: return 'Etapa 13 - Liberados para o intervalo';
      case 15: return 'Etapa 14 - Interação na Sala de Aula';
      case 16: return 'Etapa 15 - Interação com os alunos';
      case 17: return 'Etapa 16 - Interação com os alunos';
      case 18: return 'Etapa 17 - Voltar para Sala de Aula';
      case 19: return 'Etapa 18 - Interação na Sala de Aula';
      case 20: return 'Etapa 19 - Interação na Sala de Aula';
      case 21: return 'Etapa 20 - Dar um feedback para os alunos';
      case 22: return 'Etapa 21 - Fim da Aula';
      case 23: return 'Etapa 22 - Conclusão';
      default: return `Etapa ${etapa}`;
    }
  }

  getEnunciadoCompleto(etapa: number): string {
    switch(etapa) {
      case 1: return 'Você professor observa seu aluno tentando abrir o estojo, mas ele não está conseguindo, como você pode oferecer ajuda se comunicando através da CAA?';
      case 2: return 'Você, professor, chegou à sala de aula e precisa apresentar-se à turma usando CAA.';
      case 3: return 'Como você professor perguntaria o nome dos alunos usando a CAA?';
      case 4: return 'Você professor irá explicar sobre as regras na sala de aula, faça isso usando a CAA. Regra Nº 1 : Não pode conversar durante as explicações.';
      case 5: return 'Você professor irá explicar sobre as regras na sala de aula, faça isso usando a CAA. Regra Nº 2 : O aluno que quiser sair da sala de aula, pode pedir ajuda.';
      case 6: return 'Você professor irá explicar sobre as regras na sala de aula, faça isso usando a CAA. Regra Nº 3 : Eu estou aqui para ajudar vocês.';
      case 7: return 'Após explicar todas as regras aos alunos, podemos iniciar as instruções da aula usando a CAA. Agora vocês podem abrir o livro na página "X".';
      case 8: return 'Após os alunos abrirem os livros você poderá indicar que um aluno leia um trecho do texto e oferecer ajuda caso o aluno tenha dúvida. Lembre-se de fazer isso usando CAA.';
      case 9: return 'Após o aluno ler o trecho do livro, você professor poderá perguntar quem da turma gostou da leitura, faça isso usando a CAA.';
      case 10: return 'Pergunte aos seus alunos se eles querem ler mais um trecho agora ou em outra aula, faça isso usando a CAA.';
      case 11: return 'Você professor percebeu que os seus alunos querem continuar lendo, comunique que você percebeu que eles querem ler mais. Faça isso usando a CAA.';
      case 12: return 'Supondo que os alunos escolheram parar de ler, comunique a turma que você entendeu que eles não querem mais ler. Lembre-se de fazer isso usando a CAA.';
      case 13: return 'Antes de iniciar a próxima atividade, comunique os alunos que agora apenas o estojo deve permanecer em cima da mesa. Faça isso usando a CAA.';
      case 14: return 'Ao terminar atividade comunique seus alunos que eles estão liberados para ir para o intervalo, faça isso usando a CAA.';
      case 15: return 'Após o lanche, na volta para a sala de aula, conte aos alunos todos irão sair agora da sala de aula para fazer uma atividade diferente na quadra,  faça isso usando a CAA.';
      case 16: return 'Já na quadra da escola pergunte aos alunos qual atividade eles acham que irão fazer, faça isso usando a CAA.';
      case 17: return 'Após os alunos darem algumas ideias das atividades que podem ser feitas na quadra, escolha duas opções dada por eles, e peça que escolham entre elas, mas não se esqueça faça isso usando a CAA.';
      case 18: return 'Ao término da atividade na quadra, peça que seus alunos retornem a sala de aula, faça isso usando a CAA.';
      case 19: return 'Ao voltar para a sala de aula nota-se que os alunos se mantém mais agitados, falando um pouco mais sobre atividade realizada fora da sala de aula, faça um breve comentário com os alunos mostrando que você percebeu que eles gostaram. Faça isso usando a CAA.';
      case 20: return 'Aproveitando esse momento de troca entre a turma, pergunte quando eles querem fazer uma nova atividade fora da sala de aula. Faça isso usando a CAA.';
      case 21: return 'Faça um breve comentário de que você também gostou de fazer atividade hoje, usa a CAA para fazer esse comentário.';
      case 22: return 'Para finalizar a aula, comunique que a aula acabou e que estão liberados para sair da sala, não se esqueça de fazer isso usando a CAA.';
      case 23: return 'Parabéns!!! Curso concluído com sucesso! Agora você é um Professor Parceiro de Comunicação Alternativa e Aumentativa para alunos TEA não-verbais!';
      default: return `Etapa ${etapa}`;
    }
  }

  abrirFormulario(){
    window.open('https://forms.gle/G8vHfJTT3s427W5x9', '_blank');
  }
}
