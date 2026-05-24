import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../category.service';
import { Category } from '../../../models/category';

@Component({
  selector: 'app-category-manager',
  standalone: true,
  templateUrl: './category-manager.component.html',
  styleUrl: './category-manager.component.scss',
  imports: [FormsModule],
})
export class CategoryManagerComponent implements OnInit {
  categories: Category[] = [];
  newCategoryName = '';

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    this.categories = await this.categoryService.getAll();
    this.cdr.detectChanges();
  }

  async addCategory() {
    await this.categoryService.add(this.newCategoryName);
    this.newCategoryName = '';
    await this.loadCategories();
  }

  async deleteCategory(name: string) {
    await this.categoryService.delete(name);
    await this.loadCategories();
  }
}