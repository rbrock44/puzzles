import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TileComponent } from '../tile/tile';
import { Category } from '../../objects/category';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './category.html',
  styleUrl: './category.scss',
})
export class CategoryComponent {
  @Input() category: Category = {
    name: '',
    tiles: []
  };
}
